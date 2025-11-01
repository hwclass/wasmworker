import { WasmWorker } from '@wasmworker/sdk';

let worker: WasmWorker | null = null;

// DOM elements
const statusEl = document.getElementById('status') as HTMLDivElement;
const initBtn = document.getElementById('init-btn') as HTMLButtonElement;
const addBtn = document.getElementById('add-btn') as HTMLButtonElement;
const subtractBtn = document.getElementById('subtract-btn') as HTMLButtonElement;
const multiplyBtn = document.getElementById('multiply-btn') as HTMLButtonElement;
const doubleBtn = document.getElementById('double-btn') as HTMLButtonElement;
const benchBtn = document.getElementById('bench-btn') as HTMLButtonElement;
const concurrentBtn = document.getElementById('concurrent-btn') as HTMLButtonElement;
const errorBtn = document.getElementById('error-btn') as HTMLButtonElement;
const numAInput = document.getElementById('num-a') as HTMLInputElement;
const numBInput = document.getElementById('num-b') as HTMLInputElement;
const fibNInput = document.getElementById('fib-n') as HTMLInputElement;
const basicResultEl = document.getElementById('basic-result') as HTMLDivElement;
const benchmarkResultsEl = document.getElementById('benchmark-results') as HTMLDivElement;
const concurrentResultEl = document.getElementById('concurrent-result') as HTMLDivElement;
const errorResultEl = document.getElementById('error-result') as HTMLDivElement;

// Set status
function setStatus(state: 'loading' | 'ready' | 'error', text: string) {
  statusEl.className = `status ${state}`;
  statusEl.textContent = text;
}

// Enable/disable buttons
function setButtonsEnabled(enabled: boolean) {
  addBtn.disabled = !enabled;
  subtractBtn.disabled = !enabled;
  multiplyBtn.disabled = !enabled;
  doubleBtn.disabled = !enabled;
  benchBtn.disabled = !enabled;
  concurrentBtn.disabled = !enabled;
  errorBtn.disabled = !enabled;
}

// Initialize worker
initBtn.addEventListener('click', async () => {
  try {
    setStatus('loading', 'Initializing...');
    initBtn.disabled = true;

    // Load the WASM module
    worker = await WasmWorker.load({
      moduleUrl: '/examples/rust-add/dist/module.wasm',
    });

    setStatus('ready', 'Worker Ready');
    setButtonsEnabled(true);
  } catch (error) {
    setStatus('error', `Error: ${error instanceof Error ? error.message : String(error)}`);
    initBtn.disabled = false;
  }
});

// Basic operations
addBtn.addEventListener('click', async () => {
  try {
    const a = parseInt(numAInput.value);
    const b = parseInt(numBInput.value);
    const result = await worker!.call<{ a: number; b: number }, number>('add', { a, b });
    basicResultEl.innerHTML = `<div class="result"><strong>Result:</strong> ${a} + ${b} = ${result}</div>`;
  } catch (error) {
    basicResultEl.innerHTML = `<div class="error-message">${error instanceof Error ? error.message : String(error)}</div>`;
  }
});

subtractBtn.addEventListener('click', async () => {
  try {
    const a = parseInt(numAInput.value);
    const b = parseInt(numBInput.value);
    const result = await worker!.call<{ a: number; b: number }, number>('subtract', { a, b });
    basicResultEl.innerHTML = `<div class="result"><strong>Result:</strong> ${a} - ${b} = ${result}</div>`;
  } catch (error) {
    basicResultEl.innerHTML = `<div class="error-message">${error instanceof Error ? error.message : String(error)}</div>`;
  }
});

multiplyBtn.addEventListener('click', async () => {
  try {
    const a = parseInt(numAInput.value);
    const b = parseInt(numBInput.value);
    const result = await worker!.call<{ a: number; b: number }, number>('multiply', { a, b });
    basicResultEl.innerHTML = `<div class="result"><strong>Result:</strong> ${a} × ${b} = ${result}</div>`;
  } catch (error) {
    basicResultEl.innerHTML = `<div class="error-message">${error instanceof Error ? error.message : String(error)}</div>`;
  }
});

doubleBtn.addEventListener('click', async () => {
  try {
    const a = parseInt(numAInput.value);
    const result = await worker!.call<number, number>('double', a);
    basicResultEl.innerHTML = `<div class="result"><strong>Result:</strong> ${a} × 2 = ${result}</div>`;
  } catch (error) {
    basicResultEl.innerHTML = `<div class="error-message">${error instanceof Error ? error.message : String(error)}</div>`;
  }
});

// Fibonacci in JavaScript (for comparison)
function fibJS(n: number): number {
  if (n <= 1) return n;
  return fibJS(n - 1) + fibJS(n - 2);
}

// Benchmark
benchBtn.addEventListener('click', async () => {
  try {
    const n = parseInt(fibNInput.value);
    benchBtn.innerHTML = '<span class="loading-spinner"></span> Running...';
    benchBtn.disabled = true;

    // Run JS version
    const jsStart = performance.now();
    const jsResult = fibJS(n);
    const jsTime = performance.now() - jsStart;

    // Run WASM version
    const wasmStart = performance.now();
    const wasmResult = await worker!.call<number, number>('fib', n);
    const wasmTime = performance.now() - wasmStart;

    const jsWins = jsTime < wasmTime;
    const speedup = jsWins ? (wasmTime / jsTime).toFixed(2) : (jsTime / wasmTime).toFixed(2);

    benchmarkResultsEl.innerHTML = `
      <div class="benchmark-card ${jsWins ? 'winner' : ''}">
        <h3>JavaScript</h3>
        <div class="benchmark-time">${jsTime.toFixed(2)}</div>
        <div class="benchmark-label">milliseconds</div>
        <div class="result" style="margin-top: 0.5rem;">fib(${n}) = ${jsResult}</div>
      </div>
      <div class="benchmark-card ${!jsWins ? 'winner' : ''}">
        <h3>WebAssembly</h3>
        <div class="benchmark-time">${wasmTime.toFixed(2)}</div>
        <div class="benchmark-label">milliseconds</div>
        <div class="result" style="margin-top: 0.5rem;">fib(${n}) = ${wasmResult}</div>
      </div>
      <div class="result" style="grid-column: 1 / -1;">
        <strong>${jsWins ? 'JavaScript' : 'WebAssembly'} is ${speedup}x faster!</strong>
        ${!jsWins ? ' Also, UI remained responsive during WASM execution.' : ''}
      </div>
    `;

    benchBtn.innerHTML = 'Run Benchmark';
    benchBtn.disabled = false;
  } catch (error) {
    benchmarkResultsEl.innerHTML = `<div class="error-message">${error instanceof Error ? error.message : String(error)}</div>`;
    benchBtn.innerHTML = 'Run Benchmark';
    benchBtn.disabled = false;
  }
});

// Concurrent calls
concurrentBtn.addEventListener('click', async () => {
  try {
    concurrentResultEl.innerHTML = '<div class="result">Running 5 concurrent calls...</div>';
    concurrentBtn.disabled = true;

    const start = performance.now();

    // Fire 5 calls simultaneously
    const promises = [
      worker!.call<{ a: number; b: number }, number>('add', { a: 10, b: 20 }),
      worker!.call<{ a: number; b: number }, number>('multiply', { a: 5, b: 6 }),
      worker!.call<number, number>('double', 15),
      worker!.call<number, number>('fib', 10),
      worker!.call<{ a: number; b: number }, number>('subtract', { a: 100, b: 25 }),
    ];

    const results = await Promise.all(promises);
    const elapsed = performance.now() - start;

    concurrentResultEl.innerHTML = `
      <div class="result">
        <strong>All 5 calls completed in ${elapsed.toFixed(2)}ms</strong><br/>
        Results: [${results.join(', ')}]<br/>
        <em>All requests were processed correctly with unique IDs!</em>
      </div>
    `;

    concurrentBtn.disabled = false;
  } catch (error) {
    concurrentResultEl.innerHTML = `<div class="error-message">${error instanceof Error ? error.message : String(error)}</div>`;
    concurrentBtn.disabled = false;
  }
});

// Error handling
errorBtn.addEventListener('click', async () => {
  try {
    await worker!.call('nonExistentFunction', {});
    errorResultEl.innerHTML = '<div class="error-message">Expected an error but got success?!</div>';
  } catch (error: any) {
    errorResultEl.innerHTML = `
      <div class="result">
        <strong>Error caught successfully!</strong><br/>
        Code: <code>${error.code || 'N/A'}</code><br/>
        Message: ${error.message}<br/>
        ${error.details ? `Details: <pre>${JSON.stringify(error.details, null, 2)}</pre>` : ''}
      </div>
    `;
  }
});
