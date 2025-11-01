# @wasmworker/sdk

Lightweight SDK for running WebAssembly modules inside WebWorkers with a clean, typed API.

## Installation

```bash
npm install @wasmworker/sdk
# or
pnpm add @wasmworker/sdk
# or
yarn add @wasmworker/sdk
```

## Quick Start

```typescript
import { WasmWorker } from '@wasmworker/sdk';

// Load a WASM module
const worker = await WasmWorker.load({
  moduleUrl: '/path/to/module.wasm'
});

// Call a function
const result = await worker.call<{ a: number; b: number }, number>('add', {
  a: 5,
  b: 3
});

console.log(result); // 8

// Terminate when done
worker.terminate();
```

## How It Works

WasmWorker runs your WebAssembly modules in a separate WebWorker thread, keeping your main thread free for UI updates and user interactions. It handles:

- **Worker lifecycle**: Automatic worker creation and initialization
- **Message passing**: Type-safe request/response protocol
- **Concurrency**: Multiple inflight calls with unique IDs
- **Error handling**: Structured errors with codes and details
- **Memory efficiency**: Optional Transferable support for large buffers

## API

### `WasmWorker.load(options: LoadOptions): Promise<WasmWorker>`

Creates and initializes a new WasmWorker instance.

```typescript
interface LoadOptions {
  moduleUrl: string;
  init?: Record<string, unknown>;
}
```

### `worker.call<TIn, TOut>(fn: string, payload?: TIn, options?: CallOptions): Promise<TOut>`

Calls an exported WASM function with optional payload.

```typescript
interface CallOptions {
  transfer?: Transferable[];
}
```

**Payload Types:**
- Primitives: Passed directly to function
- Objects: Values extracted and passed as arguments
- Arrays: Spread as function arguments

### `worker.stream<TIn, TChunk>(fn: string, payload?: TIn): AsyncIterable<TChunk>`

Streams data from a WASM function (experimental).

### `worker.terminate(): void`

Terminates the worker and cleans up resources.

## Error Handling

All errors include a `code` property for programmatic handling:

```typescript
try {
  await worker.call('unknownFn', {});
} catch (error) {
  if (error.code === 'FN_NOT_FOUND') {
    // Handle missing function
  }
}
```

### Error Codes

- `MODULE_FETCH_FAILED` - Failed to fetch WASM module
- `WASM_INIT_FAILED` - WASM instantiation failed
- `FN_NOT_FOUND` - Function not exported by module
- `INVALID_PAYLOAD` - Invalid payload type
- `WASM_TRAP` - Runtime error in WASM
- `NOT_INITIALIZED` - Worker not ready

## Examples

### Concurrent Calls

```typescript
const results = await Promise.all([
  worker.call('add', { a: 1, b: 2 }),
  worker.call('multiply', { a: 3, b: 4 }),
  worker.call('subtract', { a: 10, b: 5 }),
]);
```

### With Transferables

```typescript
const largeBuffer = new Uint8Array(1024 * 1024);
const result = await worker.call('process', largeBuffer, {
  transfer: [largeBuffer.buffer]
});
```

## TypeScript

The SDK is written in TypeScript with full type definitions included. Use generics for type-safe calls:

```typescript
interface AddInput {
  a: number;
  b: number;
}

const sum = await worker.call<AddInput, number>('add', { a: 5, b: 3 });
// sum is typed as number
```

## Performance Tips

1. **Use Transferables** for large ArrayBuffers to avoid copying
2. **Batch operations** when possible to reduce message overhead
3. **Fire concurrent calls** with Promise.all() for parallel execution
4. **Profile first** - message passing has overhead, so ensure WASM benefits outweigh it

## Requirements

- Browser with WebAssembly support
- Browser with WebWorker support
- ES2022+ environment

## License

MIT
