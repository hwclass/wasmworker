import type {
  WorkerRequest,
  InitMsg,
  CallMsg,
  StreamOpenMsg,
  ErrorCode,
} from '../types.js';

/**
 * WASM runtime state
 */
interface RuntimeState {
  instance: WebAssembly.Instance | null;
  memory: WebAssembly.Memory | null;
  initialized: boolean;
}

const state: RuntimeState = {
  instance: null,
  memory: null,
  initialized: false,
};

/**
 * Send a result message back to the main thread
 */
function sendResult(id: string, value?: unknown): void {
  postMessage({
    id,
    type: 'result',
    value,
  });
}

/**
 * Send an error message back to the main thread
 */
function sendError(id: string, code: ErrorCode, message: string, details?: unknown): void {
  postMessage({
    id,
    type: 'error',
    error: { code, message, details },
  });
}

/**
 * Initialize the WASM module
 */
async function handleInit(msg: InitMsg): Promise<void> {
  try {
    const response = await fetch(msg.moduleUrl);

    if (!response.ok) {
      sendError(
        msg.id,
        'MODULE_FETCH_FAILED',
        `Failed to fetch module: ${response.statusText}`,
        { status: response.status, url: msg.moduleUrl }
      );
      return;
    }

    const wasmBuffer = await response.arrayBuffer();
    const wasmModule = await WebAssembly.compile(wasmBuffer);

    // Create imports object
    const imports: WebAssembly.Imports = {
      env: msg.init as Record<string, WebAssembly.ImportValue> || {},
    };

    state.instance = await WebAssembly.instantiate(wasmModule, imports);

    // Try to get memory export
    if (state.instance.exports.memory instanceof WebAssembly.Memory) {
      state.memory = state.instance.exports.memory;
    }

    state.initialized = true;
    sendResult(msg.id, { initialized: true });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    sendError(
      msg.id,
      'WASM_INIT_FAILED',
      `Failed to initialize WASM module: ${errorMsg}`,
      { error: errorMsg }
    );
  }
}

/**
 * Call a WASM function
 */
function handleCall(msg: CallMsg): void {
  if (!state.initialized || !state.instance) {
    sendError(msg.id, 'NOT_INITIALIZED', 'Worker not initialized with WASM module');
    return;
  }

  try {
    const fn = state.instance.exports[msg.fn];

    if (typeof fn !== 'function') {
      sendError(
        msg.id,
        'FN_NOT_FOUND',
        `Function "${msg.fn}" not found in WASM module`,
        { availableFunctions: Object.keys(state.instance.exports).filter(k => typeof state.instance!.exports[k] === 'function') }
      );
      return;
    }

    let result: unknown;

    // Handle different payload types
    if (msg.payload === null || msg.payload === undefined) {
      result = fn();
    } else if (typeof msg.payload === 'object' && !Array.isArray(msg.payload)) {
      // Object payload - extract values in order
      const args = Object.values(msg.payload);
      result = fn(...args);
    } else if (Array.isArray(msg.payload)) {
      // Array payload
      result = fn(...msg.payload);
    } else {
      // Single primitive value
      result = fn(msg.payload);
    }

    sendResult(msg.id, result);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    sendError(
      msg.id,
      'WASM_TRAP',
      `WASM execution error: ${errorMsg}`,
      { function: msg.fn, error: errorMsg }
    );
  }
}

/**
 * Handle streaming call (stub for now)
 */
function handleStreamOpen(msg: StreamOpenMsg): void {
  // For PoC, streaming will be implemented later
  sendError(msg.id, 'UNKNOWN_ERROR', 'Streaming not yet implemented');
}

/**
 * Message handler
 */
self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'init':
      void handleInit(msg);
      break;
    case 'call':
      handleCall(msg);
      break;
    case 'stream_open':
      handleStreamOpen(msg);
      break;
    default:
      // Type-safe exhaustiveness check
      const _exhaustive: never = msg;
      console.warn('Unknown message type:', _exhaustive);
  }
});

// Signal that the worker is ready
postMessage({ type: 'ready' });
