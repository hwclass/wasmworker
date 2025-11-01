#!/bin/bash
set -e

echo "Building WASM module..."

# Create dist directory
mkdir -p dist

# Build with cargo
cargo build --target wasm32-unknown-unknown --release

# Copy the wasm file to dist
cp target/wasm32-unknown-unknown/release/rust_add.wasm dist/module.wasm

# Get the file size
SIZE=$(wc -c < dist/module.wasm | tr -d ' ')
echo "Built module.wasm (${SIZE} bytes)"
