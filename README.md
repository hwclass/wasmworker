<p align="center">
  <img src="./logo-transparent.png" alt="WasmWorker Logo" width="200" />
</p>

<h1 align="center">WasmWorker</h1>

<p align="center">
  <em>High-performance WebAssembly SDK for browser-based parallel computation.</em>
</p>

---

## 🚀 Overview

**WasmWorker** is a lightweight SDK that lets developers run WebAssembly modules inside WebWorkers effortlessly.

It provides a clean API to offload CPU-heavy workloads off the main thread — combining **native performance** with **JavaScript simplicity**.

---

## ✨ Features

- 🧩 **Plug-and-play** WebAssembly execution
- ⚡ **Parallel processing** via WebWorkers
- 🔄 **Typed message bridge** between JS and WASM
- 🌍 Works with **Rust, Go, C/C++, or AssemblyScript** modules
- 🔒 **Structured error handling** with error codes
- 🎯 **TypeScript-first** with full type safety
- 🚀 **Zero dependencies** - lightweight and fast
- 🔀 **Concurrent calls** with automatic request management

---

## 🧱 Quick Start

```bash
# Install with your favorite package manager
npm install @wasmworker/sdk
# or
pnpm add @wasmworker/sdk
```

```typescript
import { WasmWorker } from '@wasmworker/sdk'

// Load a WASM module
const worker = await WasmWorker.load({
  moduleUrl: '/path/to/module.wasm'
})

// Call WASM functions with type safety
const result = await worker.call<{ a: number; b: number }, number>('add', {
  a: 5,
  b: 3
})

console.log(result) // → 8

// Clean up when done
worker.terminate()
```

---

## 📖 Documentation

### API Reference

#### `WasmWorker.load(options)`

Load a WASM module in a new WebWorker.

```typescript
static async load(options: LoadOptions): Promise<WasmWorker>

interface LoadOptions {
  moduleUrl: string;           // URL to the WASM module
  init?: Record<string, unknown>; // Optional import object
}
```

#### `worker.call(fn, payload?, options?)`

Call a WASM function with optional payload.

```typescript
async call<TIn = unknown, TOut = unknown>(
  fn: string,
  payload?: TIn,
  options?: CallOptions
): Promise<TOut>

interface CallOptions {
  transfer?: Transferable[]; // Objects to transfer ownership
}
```

#### `worker.terminate()`

Terminate the worker and clean up resources.

```typescript
terminate(): void
```

### Examples

#### Concurrent Calls

Run multiple WASM functions in parallel:

```typescript
const [sum, product, difference] = await Promise.all([
  worker.call('add', { a: 10, b: 20 }),
  worker.call('multiply', { a: 5, b: 6 }),
  worker.call('subtract', { a: 100, b: 25 })
])

console.log(sum, product, difference) // 30, 30, 75
```

#### Error Handling

Structured errors with codes for programmatic handling:

```typescript
try {
  await worker.call('unknownFunction', {})
} catch (error) {
  console.error(error.code)    // 'FN_NOT_FOUND'
  console.error(error.message)  // "Function not found..."
  console.error(error.details)  // { availableFunctions: [...] }
}
```

#### With Transferables

Efficiently pass large buffers without copying:

```typescript
const buffer = new Uint8Array(1024 * 1024) // 1MB
const result = await worker.call('process', buffer, {
  transfer: [buffer.buffer] // Transfer ownership for zero-copy
})
```

---

## 🧩 Example Use Cases

- 🔢 Real-time analytics and data processing in the browser
- 🖼️ Image and video processing without blocking UI
- 🔐 Cryptographic operations and hashing
- 🎮 Physics simulations and game engines
- 🤖 AI model inference at the edge
- 📊 Large dataset transformations

---

## 🔌 Framework Integration

### Vanilla JavaScript/TypeScript

```typescript
import { WasmWorker } from '@wasmworker/sdk';

let worker: WasmWorker | null = null;

async function initializeWorker() {
  worker = await WasmWorker.load({
    moduleUrl: '/path/to/module.wasm'
  });
  console.log('Worker initialized!');
}

async function processData(input: number) {
  if (!worker) {
    throw new Error('Worker not initialized');
  }

  const result = await worker.call('process', input);
  return result;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeWorker().catch(console.error);
});

// Use in event handlers
document.getElementById('btn')?.addEventListener('click', async () => {
  const result = await processData(42);
  document.getElementById('output')!.textContent = `Result: ${result}`;
});
```

### React

```typescript
import { WasmWorker } from '@wasmworker/sdk';
import { useState, useEffect, useCallback } from 'react';

// Custom hook for WasmWorker
function useWasmWorker(moduleUrl: string) {
  const [worker, setWorker] = useState<WasmWorker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    WasmWorker.load({ moduleUrl })
      .then((w) => {
        if (mounted) {
          setWorker(w);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      worker?.terminate();
    };
  }, [moduleUrl]);

  const call = useCallback(
    async <TIn, TOut>(fn: string, payload?: TIn): Promise<TOut> => {
      if (!worker) throw new Error('Worker not initialized');
      return worker.call<TIn, TOut>(fn, payload);
    },
    [worker]
  );

  return { worker, loading, error, call };
}

// Component example
export function WasmComponent() {
  const { loading, error, call } = useWasmWorker('/module.wasm');
  const [result, setResult] = useState<number | null>(null);

  const handleProcess = async () => {
    try {
      const output = await call<number, number>('process', 42);
      setResult(output);
    } catch (err) {
      console.error('Processing failed:', err);
    }
  };

  if (loading) return <div>Loading WASM module...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleProcess}>Process Data</button>
      {result !== null && <p>Result: {result}</p>}
    </div>
  );
}
```

### Vue 3

```typescript
import { WasmWorker } from '@wasmworker/sdk';
import { ref, onMounted, onUnmounted } from 'vue';

export function useWasmWorker(moduleUrl: string) {
  const worker = ref<WasmWorker | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  onMounted(async () => {
    try {
      worker.value = await WasmWorker.load({ moduleUrl });
      loading.value = false;
    } catch (err) {
      error.value = err as Error;
      loading.value = false;
    }
  });

  onUnmounted(() => {
    worker.value?.terminate();
  });

  const call = async <TIn, TOut>(fn: string, payload?: TIn): Promise<TOut> => {
    if (!worker.value) throw new Error('Worker not initialized');
    return worker.value.call<TIn, TOut>(fn, payload);
  };

  return { worker, loading, error, call };
}
```

---

## 🏗️ Building WASM Modules

### Quick Example

```rust
#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}

#[no_mangle]
pub extern "C" fn fib(n: u32) -> u64 {
    if n <= 1 {
        return n as u64;
    }
    fib(n - 1) + fib(n - 2)
}
```

**Build:**
```bash
cargo build --target wasm32-unknown-unknown --release
```

### Running the Example

```bash
# 1. Build the WASM module
cd examples/rust-add
./build.sh

# 2. Run the demo (from repo root)
cd ../..
pnpm demo
```

The demo app will open at `http://localhost:3000` with the example pre-loaded!

### Complete Guide

For detailed instructions on building WASM modules, optimization tips, and creating your own examples, see:

📚 **[Examples Guide](./examples/README.md)** - Complete guide with step-by-step instructions

Available examples:
- **[rust-add](./examples/rust-add)** - Basic Rust WASM module with arithmetic and Fibonacci

---

## 🎯 Architecture

```
┌─────────────────┐           ┌──────────────────┐
│   Main Thread   │           │   WebWorker      │
│                 │           │                  │
│  WasmWorker SDK │  ◄─────►  │  WASM Runtime    │
│                 │  Messages │                  │
│  Your App Code  │           │  WASM Module     │
└─────────────────┘           └──────────────────┘
```

WasmWorker uses a structured message protocol for communication:
- **`init`**: Initialize worker with WASM module
- **`call`**: Execute a WASM function
- **`result`**: Successful result
- **`error`**: Error with code and details

---

## 🔧 Development

### Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Build WASM example
cd examples/rust-add && ./build.sh

# Run demo
pnpm demo
```

### Project Structure

```
wasmworker/
├── packages/
│   └── sdk/              # Main SDK package
│       ├── src/
│       │   ├── index.ts      # Public API
│       │   ├── bridge.ts     # WasmWorker class
│       │   ├── types.ts      # TypeScript types
│       │   └── worker/
│       │       └── runtime.ts # Worker script
│       └── tests/            # Unit tests
├── apps/
│   └── demo/             # Demo application
├── examples/
│   └── rust-add/         # Rust WASM example
└── README.md
```

### Scripts

- `pnpm build` - Build all packages
- `pnpm dev` - Start demo in dev mode
- `pnpm demo` - Run demo application
- `pnpm test` - Run all tests
- `pnpm typecheck` - Type check all packages

---

## 🚦 Error Codes

| Code | Description |
|------|-------------|
| `MODULE_FETCH_FAILED` | Failed to fetch WASM module |
| `WASM_INIT_FAILED` | Failed to initialize WASM module |
| `FN_NOT_FOUND` | Function not found in WASM exports |
| `INVALID_PAYLOAD` | Invalid payload type |
| `WASM_TRAP` | WASM execution error/trap |
| `NOT_INITIALIZED` | Worker not initialized |

---

## 🗺️ Roadmap

### Core Features

- [ ] **Persistent Worker Sessions** - Keep worker + WASM instance alive across calls with retained memory/state. Critical for model caching and incremental AI inference.
- [ ] **Worker Pooling** - Automatically spawn and manage multiple workers. Enables parallel inference or batching for multiple requests.
- [ ] **Streaming Results** - Return data incrementally via async iterators. Essential for token-by-token AI model outputs.
- [ ] **Type-Safe Bindings** - Auto-generate TypeScript interfaces from WASM exports. Improves DX with full type safety.
- [ ] **WASI Support** - Extended compatibility with WASI-enabled runtimes. Helpful for advanced AI libraries.
- [ ] **Memory Management Helpers** - Tools for efficient memory allocation/deallocation patterns.

### Upcoming Examples

- [ ] **🤖 Mini AI Inference Worker** - Lightweight model (sentiment classifier, keyword extractor) running entirely in browser with persistent WASM worker keeping model in memory
- [ ] **📊 Real-time Analytics Engine** - Process streaming data with WebAssembly
- [ ] **🎨 Image Processing Pipeline** - Parallel image transformation using worker pool
- [ ] **🔐 Cryptography Suite** - Secure operations in isolated workers

### Future Enhancements

- [ ] Multiple module support with dependency resolution
- [ ] Advanced error recovery and retry mechanisms
- [ ] Performance profiling and monitoring tools
- [ ] Browser compatibility testing suite
- [ ] WebGPU integration for hybrid compute

---

## 🌐 Browser Support

- Chrome/Edge: 79+
- Firefox: 79+
- Safari: 15.4+

**Requires:**
- WebAssembly support
- WebWorker support
- ES2022 features

---

## 📄 License

MIT © 2025 — Created by Baris Guler
