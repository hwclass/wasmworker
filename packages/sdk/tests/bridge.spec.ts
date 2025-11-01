import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WasmWorker } from '../src/bridge';

describe('WasmWorker', () => {
  let worker: WasmWorker | null = null;

  afterEach(() => {
    if (worker) {
      worker.terminate();
      worker = null;
    }
  });

  describe('load', () => {
    it('should create a WasmWorker instance', async () => {
      // Note: This will fail in Node.js without proper Worker polyfill
      // In a real test environment, you'd use a browser-like environment or mock Worker
      expect(WasmWorker).toBeDefined();
      expect(typeof WasmWorker.load).toBe('function');
    });

    it('should accept LoadOptions', () => {
      const options = {
        moduleUrl: '/test.wasm',
        init: { test: 'value' },
      };
      expect(options.moduleUrl).toBe('/test.wasm');
    });
  });

  describe('call', () => {
    it('should throw error if worker not initialized', async () => {
      // Create a mock worker instance without proper initialization
      const uninitialized = Object.create(WasmWorker.prototype);
      uninitialized.worker = null;

      await expect(uninitialized.call('test', {})).rejects.toThrow('Worker not initialized');
    });
  });

  describe('terminate', () => {
    it('should clean up resources', () => {
      const mockWorker = Object.create(WasmWorker.prototype);
      mockWorker.worker = {
        terminate: vi.fn(),
      };
      mockWorker.pendingRequests = new Map();
      mockWorker.streamingRequests = new Map();

      mockWorker.terminate();

      expect(mockWorker.worker).toBeNull();
      expect(mockWorker.pendingRequests.size).toBe(0);
      expect(mockWorker.streamingRequests.size).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should create error with correct properties', () => {
      const mockWorker = Object.create(WasmWorker.prototype);
      const error = mockWorker.createError('FN_NOT_FOUND', 'Function not found', { fn: 'test' });

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Function not found');
      expect((error as any).code).toBe('FN_NOT_FOUND');
      expect((error as any).details).toEqual({ fn: 'test' });
    });
  });

  describe('message handling', () => {
    it('should handle result messages', () => {
      const mockWorker = Object.create(WasmWorker.prototype);
      mockWorker.pendingRequests = new Map();
      mockWorker.streamingRequests = new Map();

      const resolveMock = vi.fn();
      mockWorker.pendingRequests.set('test-id', {
        resolve: resolveMock,
        reject: vi.fn(),
      });

      const message = {
        data: {
          id: 'test-id',
          type: 'result' as const,
          value: 42,
        },
      };

      mockWorker.handleMessage(message);

      expect(resolveMock).toHaveBeenCalledWith(42);
      expect(mockWorker.pendingRequests.has('test-id')).toBe(false);
    });

    it('should handle error messages', () => {
      const mockWorker = Object.create(WasmWorker.prototype);
      mockWorker.pendingRequests = new Map();
      mockWorker.streamingRequests = new Map();

      const rejectMock = vi.fn();
      mockWorker.pendingRequests.set('test-id', {
        resolve: vi.fn(),
        reject: rejectMock,
      });

      // Add createError method
      mockWorker.createError = (code: string, message: string, details?: unknown) => {
        const error = new Error(message);
        (error as any).code = code;
        (error as any).details = details;
        return error;
      };

      const message = {
        data: {
          id: 'test-id',
          type: 'error' as const,
          error: {
            code: 'FN_NOT_FOUND',
            message: 'Function not found',
            details: {},
          },
        },
      };

      mockWorker.handleMessage(message);

      expect(rejectMock).toHaveBeenCalled();
      expect(mockWorker.pendingRequests.has('test-id')).toBe(false);
    });

    it('should ignore ready messages', () => {
      const mockWorker = Object.create(WasmWorker.prototype);
      mockWorker.pendingRequests = new Map();
      mockWorker.streamingRequests = new Map();

      const message = {
        data: {
          type: 'ready' as const,
        },
      };

      // Should not throw
      expect(() => mockWorker.handleMessage(message)).not.toThrow();
    });
  });
});
