# Rust Add Example

Simple WASM module built from Rust for testing WasmWorker.

## Functions

- `add(a: i32, b: i32) -> i32` - Add two numbers
- `fib(n: u32) -> u64` - Calculate Fibonacci number (recursive)
- `double(x: i32) -> i32` - Multiply by 2
- `subtract(a: i32, b: i32) -> i32` - Subtract two numbers
- `multiply(a: i32, b: i32) -> i32` - Multiply two numbers

## Building

Requirements:
- Rust toolchain
- wasm32-unknown-unknown target: `rustup target add wasm32-unknown-unknown`

Build:
```bash
pnpm build
```

This will create `dist/module.wasm`.
