# Flex Programming Language Quick Reference

## Running Flex Programs

### Web IDE (Recommended)
Access the Flex Web IDE through your browser for instant coding without installation.

### Command Line
#### Unix/Linux/macOS
```bash
./flex.sh your_program.lx
```

#### Windows
```bash
flex.bat your_program.lx
```

## File Extensions
- **Primary:** `.lx` (preferred)
- **Alternative:** `.txt` (for compatibility)

## Comments
```flex
# This is a single-line comment
# Comments start with the hash symbol
```

## Variables and Data Types

### Type Declarations
```flex
# Explicit type annotation
rakm age = 25                  # Integer
rakm pi = 3.14159             # Float

# Type inference (recommended)
name = "Alice"                # String
is_active = true              # Boolean
score = 95.5                  # Float

# Arrays/Lists
dorg numbers = [1, 2, 3, 4, 5]        # Integer array
dorg names = ["Alice", "Bob"]          # String array
dorg mixed = [1, "hello", true, 3.14]  # Mixed type array
```

### String Features
```flex
# Basic assignment
message = "Hello, World!"

# String interpolation
name = "Alice"
greeting = "Hello, {name}!"    # Result: "Hello, Alice!"

# Multi-variable interpolation
x = 10
y = 20
result = "Sum of {x} and {y} is {x + y}"
```

## Operators

### Arithmetic
```flex
x + y      # Addition
x - y      # Subtraction
x * y      # Multiplication
x / y      # Division
x % y      # Modulus (remainder)
x++        # Increment (x = x + 1)
x--        # Decrement (x = x - 1)
x += 5     # Add and assign (x = x + 5)
x -= 3     # Subtract and assign
x *= 2     # Multiply and assign
x /= 4     # Divide and assign
```

### Comparison
```flex
x == y     # Equal to
x != y     # Not equal to
x > y      # Greater than
x < y      # Less than
x >= y     # Greater than or equal to
x <= y     # Less than or equal to
```

### Logical
```flex
x && y     # Logical AND (both must be true)
x || y     # Logical OR (either can be true)
!x         # Logical NOT (opposite of x)
```

## Control Structures

### Conditional Statements
```flex
# Basic if
if (condition) {
    # code
}

# If-else
if (age >= 18) {
    print("Adult")
} else {
    print("Minor")
}

# Multiple conditions
if (score >= 90) {
    print("Grade A")
} else if (score >= 80) {
    print("Grade B")
} else if (score >= 70) {
    print("Grade C")
} else {
    print("Grade F")
}

# Nested conditions
if (age >= 18) {
    if (has_license) {
        print("Can drive")
    } else {
        print("Cannot drive")
    }
}
```

### Loops

#### For Loop
```flex
# Basic for loop
for (i = 0; i < 5; i++) {
    print("Count: {i}")
}

# Loop with step
for (i = 0; i <= 10; i += 2) {
    print("Even: {i}")
}

# Countdown
for (i = 10; i > 0; i--) {
    print("Countdown: {i}")
}

# Nested loops
for (i = 1; i <= 3; i++) {
    for (j = 1; j <= 3; j++) {
        print("({i}, {j})")
    }
}
```

#### While Loop
```flex
# Basic while
i = 0
while (i < 5) {
    print("Count: {i}")
    i++
}

# Conditional while
keep_running = true
counter = 0
while (keep_running) {
    print("Running... {counter}")
    counter++
    if (counter >= 3) {
        keep_running = false
    }
}
```

#### Loop Control
```flex
# Break - exit loop immediately
for (i = 0; i < 10; i++) {
    if (i == 5) {
        break
    }
    print(i)
}

# Continue - skip to next iteration
for (i = 0; i < 10; i++) {
    if (i % 2 == 0) {
        continue  # Skip even numbers
    }
    print("Odd: {i}")
}
```

## Functions

### Function Definition
```flex
# Basic function
sndo2 function_name(param1, param2) {
    # function body
    rg3 return_value  # return statement
}

# No parameters
sndo2 greet() {
    print("Hello!")
}

# With parameters
sndo2 add(a, b) {
    rg3 a + b
}

# With typed parameters
sndo2 multiply(rakm x, rakm y) {
    rg3 x * y
}
```

### Function Examples
```flex
# Simple greeting
sndo2 greet() {
    print("Hello from function!")
}
greet()  # Call the function

# Function with return
sndo2 square(x) {
    rg3 x * x
}
result = square(5)  # result = 25

# Function with validation
sndo2 safe_divide(a, b) {
    if (b == 0) {
        print("Error: Division by zero")
        rg3 0
    }
    rg3 a / b
}

# Recursive function
sndo2 factorial(n) {
    if (n <= 1) {
        rg3 1
    }
    rg3 n * factorial(n - 1)
}
print("5! = {factorial(5)}")  # 5! = 120
```

## Input and Output

### Output Functions
```flex
# Basic print
print("Hello, World!")

# Print with variables
name = "Alice"
age = 25
print("Name: {name}, Age: {age}")

# Print with line break
etb3("This adds an extra line break")

# Print different types
number = 42
boolean = true
array = [1, 2, 3]
print("Number: {number}")
print("Boolean: {boolean}")
print("Array: {array}")
```

### Input Functions
```flex
# Basic input
print("Enter your name:")
name = da5l()
print("Hello, {name}!")

# Alternative input
print("Enter your age:")
age_str = input()

# Input with validation
print("Enter a number:")
input_str = da5l()
if (input_str.isdigit()) {
    number = int(input_str)
    print("You entered: {number}")
} else {
    print("Invalid number!")
}
```

## Arrays and Lists

### Array Operations
```flex
# Create arrays
dorg numbers = [10, 20, 30, 40, 50]
dorg names = ["Alice", "Bob", "Charlie"]

# Access elements (zero-indexed)
first = numbers[0]    # Gets 10
second = names[1]     # Gets "Bob"

# Modify elements
numbers[2] = 35       # Changes 30 to 35
names[0] = "Alex"     # Changes "Alice" to "Alex"

# Loop through array
for (i = 0; i < 5; i++) {
    print("numbers[{i}] = {numbers[i]}")
}
```

### Array Processing
```flex
# Sum array elements
sndo2 sum_array(arr, size) {
    total = 0
    for (i = 0; i < size; i++) {
        total += arr[i]
    }
    rg3 total
}

# Find maximum
sndo2 find_max(arr, size) {
    max_val = arr[0]
    for (i = 1; i < size; i++) {
        if (arr[i] > max_val) {
            max_val = arr[i]
        }
    }
    rg3 max_val
}

# Usage
dorg nums = [5, 2, 8, 1, 9]
total = sum_array(nums, 5)
maximum = find_max(nums, 5)
print("Sum: {total}, Max: {maximum}")
```

## File Operations

### Import Files
```flex
# Import utility functions
geeb "math_utils.lx"

# Import constants
geeb "constants.lx"

# Use imported functions
result = add(10, 5)  # From math_utils.lx
```

### Modular Example
**math_utils.lx:**
```flex
sndo2 add(a, b) { rg3 a + b }
sndo2 subtract(a, b) { rg3 a - b }
sndo2 multiply(a, b) { rg3 a * b }
sndo2 divide(a, b) {
    if (b == 0) {
        print("Error: Division by zero")
        rg3 0
    }
    rg3 a / b
}
```

**main.lx:**
```flex
geeb "math_utils.lx"

x = 10
y = 5
print("Addition: {add(x, y)}")
print("Subtraction: {subtract(x, y)}")
print("Multiplication: {multiply(x, y)}")
print("Division: {divide(x, y)}")
```

## Error Handling

### Enable AI Assistance
```bash
# Unix/Linux/macOS
export USE_AI=true
./flex.sh your_program.lx

# Windows
set USE_AI=true
flex.bat your_program.lx
```

### Common Error Prevention
```flex
# Input validation
sndo2 get_valid_number() {
    while (true) {
        print("Enter a number:")
        input_str = da5l()
        if (input_str.isdigit()) {
            rg3 int(input_str)
        }
        print("Invalid input. Try again.")
    }
}

# Array bounds checking
sndo2 safe_get(arr, index, size) {
    if (index >= 0 && index < size) {
        rg3 arr[index]
    } else {
        print("Index out of bounds")
        rg3 0
    }
}

# Division by zero check
sndo2 safe_divide(a, b) {
    if (b == 0) {
        print("Cannot divide by zero")
        rg3 0
    }
    rg3 a / b
}
```

## Quick Reference Tables

### Keywords
| Keyword | Purpose | Example |
|---------|---------|---------|
| `rakm` | Number type annotation | `rakm x = 10` |
| `dorg` | Array declaration | `dorg arr = [1, 2, 3]` |
| `sndo2` | Function definition | `sndo2 func() { }` |
| `rg3` | Return statement | `rg3 value` |
| `geeb` | File import | `geeb "file.lx"` |
| `da5l` | Input function | `name = da5l()` |
| `etb3` | Print with line break | `etb3("text")` |

### Built-in Functions
| Function | Purpose | Example |
|----------|---------|---------|
| `print()` | Output text | `print("Hello")` |
| `da5l()` | Get user input | `input = da5l()` |
| `input()` | Alternative input | `data = input()` |
| `etb3()` | Print with break | `etb3("text")` |
| `int()` | Convert to integer | `num = int("42")` |
| `isdigit()` | Check if numeric | `"42".isdigit()` |

### Common Patterns

#### Input Validation
```flex
sndo2 get_integer() {
    while (true) {
        print("Enter integer:")
        str = da5l()
        if (str.isdigit()) {
            rg3 int(str)
        }
        print("Invalid input!")
    }
}
```

#### Array Processing
```flex
sndo2 process_array(arr, size) {
    for (i = 0; i < size; i++) {
        # Process arr[i]
        print("Processing: {arr[i]}")
    }
}
```

#### Error Handling
```flex
sndo2 safe_operation(input) {
    if (input == null || input == "") {
        print("Invalid input")
        rg3 false
    }
    # Perform operation
    rg3 true
}
```

## Algorithm Examples

### Sorting (Bubble Sort)
```flex
sndo2 bubble_sort(arr, size) {
    for (i = 0; i < size - 1; i++) {
        for (j = 0; j < size - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                # Swap
                temp = arr[j]
                arr[j] = arr[j + 1]
                arr[j + 1] = temp
            }
        }
    }
}
```

### Searching (Linear Search)
```flex
sndo2 linear_search(arr, size, target) {
    for (i = 0; i < size; i++) {
        if (arr[i] == target) {
            rg3 i  # Return index
        }
    }
    rg3 -1  # Not found
}
```

### Mathematical Functions
```flex
sndo2 power(base, exp) {
    result = 1
    for (i = 0; i < exp; i++) {
        result *= base
    }
    rg3 result
}

sndo2 fibonacci(n) {
    if (n <= 1) {
        rg3 n
    }
    rg3 fibonacci(n - 1) + fibonacci(n - 2)
}
```

## Development Tips

### Best Practices
1. **Use descriptive names:** `user_age` not `a`
2. **Validate inputs:** Check for valid data before processing
3. **Comment your code:** Explain complex logic
4. **Test incrementally:** Build and test small pieces
5. **Handle errors:** Use validation and error checking

### Common Mistakes to Avoid
1. **Off-by-one errors:** Check loop bounds carefully
2. **Uninitialized variables:** Declare before use
3. **Division by zero:** Always check divisor
4. **Array bounds:** Validate indices before access
5. **Type mismatches:** Convert types when needed

### Debugging Strategies
1. **Add debug prints:** Track variable values
2. **Test with simple inputs:** Start with basic cases
3. **Use AI assistance:** Enable error analysis
4. **Break down complex code:** Simplify step by step
5. **Check syntax carefully:** Brackets, semicolons, etc. 