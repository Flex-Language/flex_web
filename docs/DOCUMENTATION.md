# Flex Programming Language - Complete Documentation

## Table of Contents

1. [Language Overview](#language-overview)
2. [Syntax Reference](#syntax-reference)
3. [Built-in Functions](#built-in-functions)
4. [Standard Library](#standard-library)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)
7. [Advanced Topics](#advanced-topics)
8. [Compiler Information](#compiler-information)

## Language Overview

Flex is a modern, dynamically-typed programming language designed for simplicity and performance. It features automatic type inference, string interpolation, and a clean, readable syntax.

### Design Principles

- **Simplicity**: Easy to learn and read
- **Performance**: Efficient execution
- **Interactivity**: Real-time input/output capabilities
- **Modern Features**: String interpolation, type inference

### File Extension
Flex source files use the `.lx` extension.

## Syntax Reference

### Comments

```flex
// Single-line comment

/*
   Multi-line comment
   spans multiple lines
*/
```

### Variable Declaration

```flex
// Explicit declaration (optional)
rakm variable_name = value

// Type inference (recommended)
variable_name = value
```

### Data Types

#### Primitive Types

| Type | Description | Example |
|------|-------------|---------|
| `int` | Integer numbers | `42`, `-10`, `0` |
| `float` | Floating-point numbers | `3.14`, `-2.5`, `0.0` |
| `string` | Text strings | `"hello"`, `'world'` |
| `bool` | Boolean values | `true`, `false` |

#### Type Conversion

```flex
// String to integer
number = int("42")

// Integer to string
text = str(42)

// String to float
decimal = float("3.14")

// Boolean to string
bool_text = str(true)
```

### Operators

#### Arithmetic Operators

```flex
+    // Addition
-    // Subtraction
*    // Multiplication
/    // Division
%    // Modulus (remainder)
++   // Increment (postfix)
--   // Decrement (postfix)
```

#### Comparison Operators

```flex
==   // Equal to
!=   // Not equal to
<    // Less than
>    // Greater than
<=   // Less than or equal to
>=   // Greater than or equal to
```

#### Logical Operators

```flex
&&   // Logical AND
||   // Logical OR
!    // Logical NOT
```

#### Assignment Operators

```flex
=    // Assignment
+=   // Add and assign
-=   // Subtract and assign
*=   // Multiply and assign
/=   // Divide and assign
%=   // Modulus and assign
```

### Control Flow

#### Conditional Statements

```flex
// Simple if statement
if (condition) {
    // code block
}

// If-else statement
if (condition) {
    // code block
} else {
    // alternative code block
}

// If-else if-else chain
if (condition1) {
    // code block 1
} else if (condition2) {
    // code block 2
} else {
    // default code block
}
```

#### Loops

##### For Loop

```flex
// Standard for loop
for (initialization; condition; increment) {
    // loop body
}

// Example
for (i = 0; i < 10; i++) {
    print(i)
}
```

##### While Loop

```flex
// While loop
while (condition) {
    // loop body
}

// Example
count = 0
while (count < 5) {
    print(count)
    count++
}
```

### Functions

#### Function Definition

```flex
function functionName(parameter1, parameter2, ...) {
    // function body
    return value  // optional
}
```

#### Function Examples

```flex
// Function with return value
function add(a, b) {
    return a + b
}

// Function without return value
function greet(name) {
    print("Hello, {name}!")
}

// Function with default behavior
function power(base, exponent) {
    result = 1
    for (i = 0; i < exponent; i++) {
        result = result * base
    }
    return result
}
```

### String Interpolation

Flex supports modern string interpolation using curly braces:

```flex
name = "Alice"
age = 25
message = "Hello, {name}! You are {age} years old."
print(message)  // Output: Hello, Alice! You are 25 years old.
```

#### Complex Expressions in Interpolation

```flex
x = 10
y = 20
print("The sum of {x} and {y} is {x + y}")
// Output: The sum of 10 and 20 is 30
```

## Built-in Functions

### Input/Output Functions

#### `print(value)`
Outputs a value to the console.

```flex
print("Hello, World!")
print(42)
print(variable_name)
```

#### `da5l()`
Reads a line of input from the user (preferred input method).

```flex
print("Enter your name:")
name = da5l()
print("Hello, {name}!")
```

#### `input()`
Alternative method to read user input.

```flex
print("Enter your age:")
age_str = input()
age = int(age_str)
```

### Type Conversion Functions

#### `int(value)`
Converts a value to an integer.

```flex
number = int("42")        // String to int
number = int(3.14)        // Float to int
number = int(true)        // Bool to int (1)
```

#### `float(value)`
Converts a value to a floating-point number.

```flex
decimal = float("3.14")   // String to float
decimal = float(42)       // Int to float
```

#### `str(value)`
Converts a value to a string.

```flex
text = str(42)           // Int to string
text = str(3.14)         // Float to string
text = str(true)         // Bool to string
```

#### `bool(value)`
Converts a value to a boolean.

```flex
flag = bool(1)           // true
flag = bool(0)           // false
flag = bool("hello")     // true (non-empty string)
flag = bool("")          // false (empty string)
```

### String Functions

#### `length(string)` or `string.length()`
Returns the length of a string.

```flex
text = "hello"
len = length(text)       // 5
len = text.length()      // 5
```

#### `upper(string)` or `string.upper()`
Converts string to uppercase.

```flex
text = "hello"
upper_text = upper(text)    // "HELLO"
upper_text = text.upper()   // "HELLO"
```

#### `lower(string)` or `string.lower()`
Converts string to lowercase.

```flex
text = "HELLO"
lower_text = lower(text)    // "hello"
lower_text = text.lower()   // "hello"
```

#### `contains(string, substring)` or `string.contains(substring)`
Checks if string contains substring.

```flex
text = "hello world"
has_hello = contains(text, "hello")    // true
has_hello = text.contains("hello")     // true
```

#### `isdigit(string)` or `string.isdigit()`
Checks if string represents a number.

```flex
input = "123"
is_number = isdigit(input)    // true
is_number = input.isdigit()   // true
```

### Mathematical Functions

#### `abs(number)`
Returns the absolute value of a number.

```flex
result = abs(-5)      // 5
result = abs(3.14)    // 3.14
```

#### `max(a, b)`
Returns the maximum of two values.

```flex
result = max(10, 5)   // 10
result = max(-3, -1)  // -1
```

#### `min(a, b)`
Returns the minimum of two values.

```flex
result = min(10, 5)   // 5
result = min(-3, -1)  // -3
```

## Standard Library

### Utility Functions

#### `len(collection)`
Returns the length of a collection (string, array, etc.).

```flex
text = "hello"
length = len(text)    // 5
```

#### `range(start, end)`
Generates a sequence of numbers.

```flex
// Generate numbers from 0 to 4
for (i in range(0, 5)) {
    print(i)
}
```

### Validation Functions

#### `is_number(value)`
Checks if a value can be converted to a number.

```flex
if (is_number(input)) {
    number = int(input)
}
```

#### `is_empty(value)`
Checks if a value is empty (empty string, zero, etc.).

```flex
if (is_empty(input)) {
    print("Input is empty")
}
```

## Error Handling

### Input Validation

Always validate user input to prevent runtime errors:

```flex
print("Enter a number:")
input = da5l()

if (input.isdigit()) {
    number = int(input)
    print("You entered: {number}")
} else {
    print("Error: Please enter a valid number")
}
```

### Division by Zero

Check for division by zero:

```flex
print("Enter dividend:")
a = int(da5l())
print("Enter divisor:")
b = int(da5l())

if (b != 0) {
    result = a / b
    print("Result: {result}")
} else {
    print("Error: Division by zero is not allowed")
}
```

### Function Parameter Validation

```flex
function safe_divide(a, b) {
    if (b == 0) {
        print("Error: Cannot divide by zero")
        return 0
    }
    return a / b
}
```

## Best Practices

### Code Style

1. **Variable Names**: Use descriptive names
   ```flex
   // Good
   user_age = 25
   total_score = 100
   
   // Avoid
   x = 25
   t = 100
   ```

2. **Function Names**: Use verbs for actions
   ```flex
   // Good
   function calculate_area(width, height)
   function print_report(data)
   
   // Avoid
   function area(w, h)
   function report(d)
   ```

3. **Comments**: Explain complex logic
   ```flex
   // Calculate compound interest
   // Formula: A = P(1 + r/n)^(nt)
   amount = principal * power((1 + rate / compounds), compounds * time)
   ```

### Performance Tips

1. **Minimize Input Operations**: Read all inputs at once when possible
2. **Use Appropriate Data Types**: Choose int over float when decimals aren't needed
3. **Avoid Redundant Calculations**: Store results in variables

### Security Considerations

1. **Always Validate Input**: Never trust user input
2. **Range Checking**: Validate numeric ranges
3. **Type Checking**: Ensure input types match expectations

## Advanced Topics

### Recursive Functions

```flex
function factorial(n) {
    if (n <= 1) {
        return 1
    }
    return n * factorial(n - 1)
}

result = factorial(5)  // 120
```

### Complex Data Processing

```flex
function process_scores(scores_input) {
    // Split input and calculate statistics
    total = 0
    count = 0
    
    // Process each score
    for (i = 0; i < len(scores_input); i++) {
        if (scores_input[i].isdigit()) {
            score = int(scores_input[i])
            total += score
            count++
        }
    }
    
    if (count > 0) {
        average = total / count
        return average
    }
    return 0
}
```

### Algorithm Implementation

```flex
// Binary search example
function binary_search(arr, target, low, high) {
    if (low > high) {
        return -1  // Not found
    }
    
    mid = (low + high) / 2
    
    if (arr[mid] == target) {
        return mid
    } else if (arr[mid] > target) {
        return binary_search(arr, target, low, mid - 1)
    } else {
        return binary_search(arr, target, mid + 1, high)
    }
}
```

## Compiler Information

### Execution Model

1. **Code Submission**: User writes Flex code in web editor
2. **WebSocket Connection**: Real-time communication established
3. **Server Processing**: Code sent to backend execution engine
4. **Interpretation**: Python-shell executes Flex interpreter
5. **Interactive Loop**: Handle `da5l()` input requests via WebSocket
6. **Output Streaming**: Results sent back to frontend in real-time

### Runtime Environment

- **Interpreter**: Python-based Flex interpreter
- **Runtime**: Server-side execution with WebSocket communication
- **Input Handling**: Real-time input via WebSocket (`da5l()` function)
- **Output Streaming**: Live output updates during execution

### Limitations

- **Execution Timeout**: Programs must complete within 30 seconds
- **Code Length**: Maximum 50KB per program
- **Memory Usage**: Limited by server resources
- **File I/O**: Not supported in online environment

### Performance Characteristics

- **Startup Time**: ~100-200ms for simple programs
- **Input Latency**: ~50-100ms for WebSocket communication
- **Throughput**: Optimized for interactive programs rather than compute-intensive tasks

---

This documentation covers the complete Flex programming language specification. For examples and tutorials, see the Examples and Tutorial sections of the online compiler. 