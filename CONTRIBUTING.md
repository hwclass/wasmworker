# Contributing to WasmWorker

Thank you for your interest in contributing to WasmWorker! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Rust toolchain (for WASM examples)
  - Install from: https://rustup.rs/
  - Add wasm32 target: `rustup target add wasm32-unknown-unknown`

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/wasmworker.git
   cd wasmworker
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build all packages**
   ```bash
   pnpm build
   ```

4. **Build WASM examples**
   ```bash
   cd examples/rust-add
   ./build.sh
   cd ../..
   ```

5. **Run tests**
   ```bash
   pnpm test
   ```

6. **Run the demo**
   ```bash
   pnpm demo
   ```

## Project Structure

```
wasmworker/
├── packages/sdk/          # Main SDK package
│   ├── src/
│   │   ├── index.ts       # Public API
│   │   ├── bridge.ts      # WasmWorker class
│   │   ├── types.ts       # TypeScript definitions
│   │   └── worker/
│   │       └── runtime.ts # Worker runtime
│   └── tests/             # Unit tests
├── apps/demo/             # Demo application
├── examples/              # Example WASM modules
│   └── rust-add/          # Rust example
└── README.md
```

## Development Workflow

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Write tests for new functionality
   - Update documentation as needed

3. **Run quality checks**
   ```bash
   # Type checking
   pnpm typecheck

   # Run tests
   pnpm test

   # Build packages
   pnpm build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Commit Message Guidelines

We follow conventional commit format:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build process or auxiliary tool changes

Examples:
```
feat: add streaming API support
fix: handle worker termination edge case
docs: update API reference with examples
test: add concurrency tests
```

### Pull Request Process

1. **Ensure all checks pass**
   - Tests pass
   - TypeScript compiles without errors
   - Code follows project style

2. **Update documentation**
   - Update README.md if needed
   - Add JSDoc comments for new public APIs
   - Include examples for new features

3. **Submit PR**
   - Provide clear description of changes
   - Reference any related issues
   - Include screenshots/demos for UI changes

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `const` and `let` over `var`
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Use type annotations for function parameters and return values

Example:
```typescript
/**
 * Load a WASM module in a new WebWorker
 * @param options - Configuration options
 * @returns Promise that resolves to WasmWorker instance
 */
static async load(options: LoadOptions): Promise<WasmWorker> {
  // implementation
}
```

### Testing

- Write unit tests for new functionality
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

Example:
```typescript
describe('WasmWorker', () => {
  describe('call', () => {
    it('should throw error if worker not initialized', async () => {
      // Arrange
      const worker = createUninitializedWorker();

      // Act & Assert
      await expect(worker.call('test', {}))
        .rejects.toThrow('Worker not initialized');
    });
  });
});
```

## Adding New Features

### Adding a New Function to SDK

1. Add types to `packages/sdk/src/types.ts`
2. Implement in appropriate file (`bridge.ts`, `worker/runtime.ts`)
3. Export from `packages/sdk/src/index.ts`
4. Add tests in `packages/sdk/tests/`
5. Update README.md with documentation
6. Add example to demo app

### Adding New WASM Examples

1. Create new directory in `examples/`
2. Add `Cargo.toml` for Rust projects
3. Implement functions in `src/lib.rs`
4. Add `build.sh` script
5. Update `package.json` with build script
6. Document in example's README.md

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests for specific package
cd packages/sdk && pnpm test
```

### Adding Tests

- Unit tests go in `packages/sdk/tests/`
- E2E tests can be added to `apps/demo/`
- Test file naming: `*.spec.ts`

## Documentation

### README Updates

Update README.md when:
- Adding new public APIs
- Changing existing behavior
- Adding new examples
- Updating requirements

### Code Comments

- Add JSDoc for all public APIs
- Use inline comments for complex logic
- Keep comments up-to-date with code changes

## Performance Considerations

- Profile before optimizing
- Consider message passing overhead
- Use Transferables for large buffers
- Avoid unnecessary copies
- Test with realistic workloads

## Security

- Never commit sensitive data
- Validate all inputs
- Handle errors gracefully
- Follow OWASP guidelines
- Report security issues privately

## Getting Help

- Open an issue for bugs or feature requests
- Ask questions in discussions
- Check existing issues before creating new ones

## License

By contributing to WasmWorker, you agree that your contributions will be licensed under the MIT License.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

Thank you for contributing to WasmWorker!
