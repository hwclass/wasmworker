import type {
  LoadOptions,
  CallOptions,
  PendingRequest,
  StreamingRequest,
  WorkerResponse,
  WasmWorkerError,
} from './types.js';

/**
 * Generate a unique ID for messages
 */
function generateId(): string {
  // Use crypto.randomUUID in modern browsers
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Main WasmWorker class that manages WASM execution in a WebWorker
 */
export class WasmWorker {
  private worker: Worker | null = null;
  private pendingRequests = new Map<string, PendingRequest>();
  private streamingRequests = new Map<string, StreamingRequest>();
  private initialized = false;

  private constructor() {}

  /**
   * Load a WASM module in a new WebWorker
   */
  static async load(options: LoadOptions): Promise<WasmWorker> {
    const instance = new WasmWorker();
    await instance.init(options);
    return instance;
  }

  /**
   * Initialize the worker with a WASM module
   */
  private async init(options: LoadOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create worker from the runtime script
        // In a real build, this would be bundled or served separately
        const workerUrl = new URL('./worker/runtime.js', import.meta.url);
        this.worker = new Worker(workerUrl, { type: 'module' });

        // Set up message handler
        this.worker.addEventListener('message', this.handleMessage.bind(this));

        // Set up error handler
        this.worker.addEventListener('error', (event) => {
          reject(new Error(`Worker error: ${event.message}`));
        });

        // Send init message
        const id = generateId();
        this.pendingRequests.set(id, {
          resolve: () => {
            this.initialized = true;
            resolve();
          },
          reject,
        });

        this.worker.postMessage({
          id,
          type: 'init',
          moduleUrl: options.moduleUrl,
          init: options.init,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        reject(new Error(`Failed to create worker: ${errorMsg}`));
      }
    });
  }

  /**
   * Handle messages from the worker
   */
  private handleMessage(event: MessageEvent<WorkerResponse>): void {
    const msg = event.data;

    // Handle ready message
    if ('type' in msg && msg.type === 'ready') {
      return;
    }

    const pending = this.pendingRequests.get(msg.id);
    const streaming = this.streamingRequests.get(msg.id);

    if (msg.type === 'result') {
      if (pending) {
        pending.resolve(msg.value);
        this.pendingRequests.delete(msg.id);
      }
    } else if (msg.type === 'error') {
      const error = this.createError(msg.error.code, msg.error.message, msg.error.details);
      if (pending) {
        pending.reject(error);
        this.pendingRequests.delete(msg.id);
      }
      if (streaming) {
        streaming.reject(error);
        this.streamingRequests.delete(msg.id);
      }
    } else if (msg.type === 'stream_chunk') {
      if (streaming) {
        streaming.queue.push(msg.value);
        if (streaming.resolve) {
          streaming.resolve({ value: streaming.queue.shift(), done: false });
        }
      }
    } else if (msg.type === 'stream_close') {
      if (streaming) {
        streaming.done = true;
        if (streaming.resolve) {
          streaming.resolve({ value: undefined, done: true });
        }
        this.streamingRequests.delete(msg.id);
      }
    }
  }

  /**
   * Create a WasmWorkerError from error details
   */
  private createError(code: string, message: string, details?: unknown): Error {
    const error = new Error(message) as WasmWorkerError;
    error.name = 'WasmWorkerError';
    (error as any).code = code;
    (error as any).details = details;
    return error;
  }

  /**
   * Call a WASM function
   */
  async call<TIn = unknown, TOut = unknown>(
    fn: string,
    payload?: TIn,
    options?: CallOptions
  ): Promise<TOut> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    if (!this.initialized) {
      throw new Error('Worker not ready');
    }

    return new Promise((resolve, reject) => {
      const id = generateId();
      this.pendingRequests.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      this.worker!.postMessage(
        {
          id,
          type: 'call',
          fn,
          payload,
        },
        options?.transfer || []
      );
    });
  }

  /**
   * Stream data from a WASM function (stub for future implementation)
   */
  async *stream<TIn = unknown, TChunk = unknown>(
    fn: string,
    payload?: TIn
  ): AsyncIterable<TChunk> {
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    if (!this.initialized) {
      throw new Error('Worker not ready');
    }

    const id = generateId();
    const request: StreamingRequest = {
      queue: [],
      resolve: () => {},
      reject: () => {},
      done: false,
    };
    this.streamingRequests.set(id, request);

    this.worker.postMessage({
      id,
      type: 'stream_open',
      fn,
      payload,
    });

    try {
      while (!request.done || request.queue.length > 0) {
        if (request.queue.length > 0) {
          yield request.queue.shift() as TChunk;
        } else {
          // Wait for next chunk
          await new Promise<IteratorResult<unknown>>((resolve, reject) => {
            request.resolve = resolve;
            request.reject = reject;
          });
        }
      }
    } finally {
      this.streamingRequests.delete(id);
    }
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.initialized = false;
      this.pendingRequests.clear();
      this.streamingRequests.clear();
    }
  }
}
