/**
 * Base message structure for worker communication
 */
export interface MsgBase {
  id: string;
  type: 'init' | 'call' | 'stream_open' | 'stream_chunk' | 'stream_close' | 'result' | 'error';
}

/**
 * Initialize the worker with a WASM module
 */
export interface InitMsg extends MsgBase {
  type: 'init';
  moduleUrl: string;
  init?: Record<string, unknown>;
}

/**
 * Call a WASM function
 */
export interface CallMsg extends MsgBase {
  type: 'call';
  fn: string;
  payload?: unknown;
}

/**
 * Result from a successful call
 */
export interface ResultMsg extends MsgBase {
  type: 'result';
  value?: unknown;
}

/**
 * Error response
 */
export interface ErrorMsg extends MsgBase {
  type: 'error';
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

/**
 * Open a streaming call
 */
export interface StreamOpenMsg extends MsgBase {
  type: 'stream_open';
  fn: string;
  payload?: unknown;
}

/**
 * Chunk of data from a streaming call
 */
export interface StreamChunkMsg extends MsgBase {
  type: 'stream_chunk';
  value: unknown;
}

/**
 * Close a streaming call
 */
export interface StreamCloseMsg extends MsgBase {
  type: 'stream_close';
}

/**
 * Worker ready signal
 */
export interface ReadyMsg {
  type: 'ready';
}

/**
 * Union of all message types sent TO the worker
 */
export type WorkerRequest = InitMsg | CallMsg | StreamOpenMsg;

/**
 * Union of all message types received FROM the worker
 */
export type WorkerResponse = ResultMsg | ErrorMsg | StreamChunkMsg | StreamCloseMsg | ReadyMsg;

/**
 * Error codes for standardized error handling
 */
export type ErrorCode =
  | 'MODULE_FETCH_FAILED'
  | 'WASM_INIT_FAILED'
  | 'FN_NOT_FOUND'
  | 'INVALID_PAYLOAD'
  | 'WASM_TRAP'
  | 'NOT_INITIALIZED'
  | 'UNKNOWN_ERROR';

/**
 * Options for loading a WASM module
 */
export interface LoadOptions {
  moduleUrl: string;
  init?: Record<string, unknown>;
}

/**
 * Options for calling a function
 */
export interface CallOptions {
  transfer?: Transferable[];
}

/**
 * Pending request state
 */
export interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
}

/**
 * Streaming request state
 */
export interface StreamingRequest {
  queue: unknown[];
  resolve: (value: IteratorResult<unknown>) => void;
  reject: (error: Error) => void;
  done: boolean;
}

/**
 * Custom error class for WasmWorker errors
 */
export class WasmWorkerError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'WasmWorkerError';
  }
}
