# WasmWorker Examples

This directory contains example WebAssembly modules demonstrating how to build and use WASM with WasmWorker.

## Available Examples

### [rust-add](./rust-add) - Basic Rust WASM Module

A simple Rust module demonstrating basic arithmetic operations and recursive functions.

**Functions:**
- `add(a: i32, b: i32) -> i32` - Add two numbers
- `subtract(a: i32, b: i32) -> i32` - Subtract two numbers
- `multiply(a: i32, b: i32) -> i32` - Multiply two numbers
- `double(x: i32) -> i32` - Double a number
- `fib(n: u32) -> u64` - Calculate Fibonacci number (recursive)

## Quick Start

### Prerequisites

- **Rust toolchain** - Install from https://rustup.rs/
- **wasm32 target** - Add with: `rustup target add wasm32-unknown-unknown`
- **Node.js** >= 20.0.0 (for running the demo)
- **pnpm** >= 8.0.0

### Building and Running an Example

#### 1. Build the WASM Module

```bash
# Navigate to the example
cd examples/rust-add

# Build the WASM module
./build.sh

# Verify the output
ls -lh dist/module.wasm
```

This will compile the Rust code to WebAssembly and output `dist/module.wasm`.

#### 2. Run the Demo Application

From the repository root:

```bash
# Make sure dependencies are installed
pnpm install

# Build the SDK
pnpm build

# Start the demo
pnpm demo
```

The demo will open at `http://localhost:3000` and automatically load the `rust-add` example module.

#### 3. Use in Your Own Project

```typescript
import { WasmWorker } from '@wasmworker/sdk';

// Load the WASM module
const worker = await WasmWorker.load({
  moduleUrl: '/examples/rust-add/dist/module.wasm'
});

// Call functions
const sum = await worker.call<{ a: number; b: number }, number>('add', {
  a: 10,
  b: 20
});

console.log(`10 + 20 = ${sum}`); // 10 + 20 = 30

// Clean up
worker.terminate();
```

## Creating Your Own Example

### Step 1: Create Project Structure

```bash
mkdir examples/my-example
cd examples/my-example
```

### Step 2: Initialize Rust Project

```toml
# Cargo.toml
[package]
name = "my-example"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[profile.release]
opt-level = "z"  # Optimize for size
lto = true       # Enable link-time optimization
```

### Step 3: Write Your Functions

```rust
// src/lib.rs
#[no_mangle]
pub extern "C" fn my_function(x: i32) -> i32 {
    x * 2
}
```

### Step 4: Create Build Script

```bash
#!/bin/bash
# build.sh
set -e

echo "Building WASM module..."
mkdir -p dist
cargo build --target wasm32-unknown-unknown --release
cp target/wasm32-unknown-unknown/release/my_example.wasm dist/module.wasm

SIZE=$(wc -c < dist/module.wasm | tr -d ' ')
echo "Built module.wasm (${SIZE} bytes)"
```

Make it executable:
```bash
chmod +x build.sh
```

### Step 5: Build and Test

```bash
./build.sh
```

## Example Patterns

### 1. Simple Function (Primitives)

```rust
#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

**Usage:**
```typescript
const result = await worker.call('add', { a: 5, b: 3 });
// result = 8
```

### 2. Single Parameter

```rust
#[no_mangle]
pub extern "C" fn square(x: i32) -> i32 {
    x * x
}
```

**Usage:**
```typescript
const result = await worker.call('square', 5);
// result = 25
```

### 3. CPU-Intensive Function

```rust
#[no_mangle]
pub extern "C" fn fibonacci(n: u32) -> u64 {
    if n <= 1 {
        return n as u64;
    }
    fibonacci(n - 1) + fibonacci(n - 2)
}
```

**Usage:**
```typescript
// Runs in worker - doesn't block UI!
const result = await worker.call('fibonacci', 40);
console.log(`fib(40) = ${result}`);
```

### 4. Working with Memory (Advanced)

For passing complex data structures or buffers, you'll need to work with WASM linear memory:

```rust
use std::slice;

#[no_mangle]
pub extern "C" fn sum_array(ptr: *const i32, len: usize) -> i32 {
    let numbers = unsafe { slice::from_raw_parts(ptr, len) };
    numbers.iter().sum()
}

#[no_mangle]
pub extern "C" fn alloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[no_mangle]
pub extern "C" fn dealloc(ptr: *mut u8, size: usize) {
    unsafe {
        Vec::from_raw_parts(ptr, size, size);
    }
}
```

## Optimization Tips

### 1. Size Optimization

In `Cargo.toml`:
```toml
[profile.release]
opt-level = "z"        # Optimize for size
lto = true             # Link-time optimization
codegen-units = 1      # Better optimization
strip = true           # Strip debug symbols
panic = "abort"        # Smaller panic handler
```

### 2. Using wasm-opt

Install `binaryen`:
```bash
# macOS
brew install binaryen

# Ubuntu/Debian
apt-get install binaryen
```

Update `build.sh`:
```bash
#!/bin/bash
set -e

cargo build --target wasm32-unknown-unknown --release
wasm-opt -Oz -o dist/module.wasm \
  target/wasm32-unknown-unknown/release/my_example.wasm

echo "Optimized: $(wc -c < dist/module.wasm) bytes"
```

### 3. Remove Unused Code

Add to `Cargo.toml`:
```toml
[profile.release]
panic = "abort"

[profile.release.package."*"]
opt-level = "z"
```

## Testing Your WASM Module

### Unit Tests in Rust

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }
}
```

Run tests:
```bash
cargo test
```

### Integration Tests with WasmWorker

Create `test.mjs`:
```javascript
import { WasmWorker } from '@wasmworker/sdk';

const worker = await WasmWorker.load({
  moduleUrl: './dist/module.wasm'
});

console.log('Testing add...');
const sum = await worker.call('add', { a: 2, b: 3 });
console.assert(sum === 5, 'add(2, 3) should equal 5');

console.log('All tests passed!');
worker.terminate();
```

Run with Node.js:
```bash
node test.mjs
```

## Debugging

### 1. Check WASM Exports

```bash
wasm-objdump -x dist/module.wasm | grep "export"
```

### 2. Validate WASM

```bash
wasm-validate dist/module.wasm
```

### 3. View Text Format

```bash
wasm2wat dist/module.wasm -o module.wat
```

## Language Support

While these examples use Rust, WasmWorker supports WASM modules compiled from any language:

- **Rust** - Excellent WASM support, zero runtime
- **C/C++** - Use Emscripten or WASI SDK
- **Go** - Use TinyGo for smaller binaries
- **AssemblyScript** - TypeScript-like syntax for WASM
- **Zig** - Modern systems language with great WASM support

## Resources

- [Rust and WebAssembly Book](https://rustwasm.github.io/docs/book/)
- [MDN WebAssembly Docs](https://developer.mozilla.org/en-US/docs/WebAssembly)
- [WebAssembly Specification](https://webassembly.github.io/spec/)
- [wasm-bindgen Guide](https://rustwasm.github.io/docs/wasm-bindgen/)

## Troubleshooting

### Build Fails with "target not found"

```bash
rustup target add wasm32-unknown-unknown
```

### Module Too Large

1. Enable size optimizations in `Cargo.toml`
2. Use `wasm-opt -Oz`
3. Remove unused dependencies
4. Use `cargo tree` to audit dependencies

### Runtime Errors

Check the browser console for detailed error messages from the WasmWorker runtime.

### Function Not Found

Ensure your function is:
1. Marked with `#[no_mangle]`
2. Declared as `pub extern "C"`
3. Actually compiled (check with `wasm-objdump`)

## Contributing Examples

We welcome contributions of new examples! Please:

1. Follow the existing structure
2. Include a README.md in your example directory
3. Add build and clean scripts
4. Test thoroughly
5. Update this main examples README

See [CONTRIBUTING.md](../CONTRIBUTING.md) for more details.
