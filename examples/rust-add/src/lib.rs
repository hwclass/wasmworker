/// Add two 32-bit integers
#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// Calculate fibonacci number (recursive, for benchmarking)
#[no_mangle]
pub extern "C" fn fib(n: u32) -> u64 {
    if n <= 1 {
        return n as u64;
    }
    fib(n - 1) + fib(n - 2)
}

/// Multiply a number by 2
#[no_mangle]
pub extern "C" fn double(x: i32) -> i32 {
    x * 2
}

/// Subtract two numbers
#[no_mangle]
pub extern "C" fn subtract(a: i32, b: i32) -> i32 {
    a - b
}

/// Multiply two numbers
#[no_mangle]
pub extern "C" fn multiply(a: i32, b: i32) -> i32 {
    a * b
}
