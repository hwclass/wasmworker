import { describe, it, expect } from 'vitest';
import type {
  LoadOptions,
  CallOptions,
  ErrorCode,
  WorkerRequest,
  WorkerResponse,
  InitMsg,
  CallMsg,
  ResultMsg,
  ErrorMsg,
} from '../src/types';
import { WasmWorkerError } from '../src/types';

describe('Types', () => {
  describe('LoadOptions', () => {
    it('should accept valid LoadOptions', () => {
      const opts: LoadOptions = {
        moduleUrl: '/test.wasm',
        init: { memory: {} },
      };

      expect(opts.moduleUrl).toBe('/test.wasm');
      expect(opts.init).toBeDefined();
    });
  });

  describe('CallOptions', () => {
    it('should accept transfer array', () => {
      const buffer = new ArrayBuffer(8);
      const opts: CallOptions = {
        transfer: [buffer],
      };

      expect(opts.transfer).toHaveLength(1);
    });
  });

  describe('ErrorCode', () => {
    it('should accept valid error codes', () => {
      const codes: ErrorCode[] = [
        'MODULE_FETCH_FAILED',
        'WASM_INIT_FAILED',
        'FN_NOT_FOUND',
        'INVALID_PAYLOAD',
        'WASM_TRAP',
        'NOT_INITIALIZED',
        'UNKNOWN_ERROR',
      ];

      codes.forEach((code) => {
        expect(typeof code).toBe('string');
      });
    });
  });

  describe('Message types', () => {
    it('should create valid InitMsg', () => {
      const msg: InitMsg = {
        id: 'test-id',
        type: 'init',
        moduleUrl: '/test.wasm',
      };

      expect(msg.type).toBe('init');
      expect(msg.moduleUrl).toBe('/test.wasm');
    });

    it('should create valid CallMsg', () => {
      const msg: CallMsg = {
        id: 'test-id',
        type: 'call',
        fn: 'add',
        payload: { a: 1, b: 2 },
      };

      expect(msg.type).toBe('call');
      expect(msg.fn).toBe('add');
    });

    it('should create valid ResultMsg', () => {
      const msg: ResultMsg = {
        id: 'test-id',
        type: 'result',
        value: 42,
      };

      expect(msg.type).toBe('result');
      expect(msg.value).toBe(42);
    });

    it('should create valid ErrorMsg', () => {
      const msg: ErrorMsg = {
        id: 'test-id',
        type: 'error',
        error: {
          code: 'FN_NOT_FOUND',
          message: 'Function not found',
          details: { fn: 'test' },
        },
      };

      expect(msg.type).toBe('error');
      expect(msg.error.code).toBe('FN_NOT_FOUND');
    });
  });

  describe('WasmWorkerError', () => {
    it('should create error with code and details', () => {
      const error = new WasmWorkerError('FN_NOT_FOUND', 'Function not found', { fn: 'test' });

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('WasmWorkerError');
      expect(error.code).toBe('FN_NOT_FOUND');
      expect(error.message).toBe('Function not found');
      expect(error.details).toEqual({ fn: 'test' });
    });

    it('should work without details', () => {
      const error = new WasmWorkerError('WASM_TRAP', 'Execution failed');

      expect(error.code).toBe('WASM_TRAP');
      expect(error.details).toBeUndefined();
    });
  });
});
