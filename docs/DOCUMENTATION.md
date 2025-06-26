# Flex Programming Language Documentation

## Introduction

Flex is a modern, custom-designed programming language that combines simplicity with powerful features. Unlike the traditional lexical analyzer generator of the same name, this Flex is a general-purpose programming language with a unique syntax that draws inspiration from various popular programming languages while maintaining its own distinct identity.

Flex features include:
- **Simple and intuitive syntax** with unique keywords
- **Type annotations and inference** for flexible programming
- **AI-assisted error handling** for better debugging experience
- **Web-based IDE** for easy development and testing
- **Real-time execution** with interactive input/output
- **File import system** for modular programming
- **Built-in support for** common data structures

This documentation provides a comprehensive guide to the Flex programming language, including its syntax, features, and how to use it effectively.

## Getting Started

### Prerequisites

- **Python 3.6 or higher** for the Flex compiler/interpreter
- **Web browser** for the Flex Web IDE
- **For AI features** (optional):
  - [LM Studio](https://lmstudio.ai/) with Qwen2.5 7B Instruct 1M model (for local AI)
  - OpenAI API key (optional, for using GPT-4o-mini)

### Installation Methods

#### Method 1: Web IDE (Recommended for Beginners)
1. Access the Flex Web IDE through your browser
2. Start coding immediately without any local installation
3. Use the built-in examples and real-time execution

#### Method 2: Local Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Flex
   ```

2. Set up AI capabilities (optional):
   - **For local AI with Qwen2.5:**
     - Install LM Studio
     - Download the Qwen2.5 7B Instruct 1M model
     - Start LM Studio and enable the API server
   - **For OpenAI:**
     - Set your OpenAI API key as an environment variable

### Running Your First Flex Program

#### Using Web IDE
1. Open the Flex Web IDE
2. Enter the following in the code editor:
   ```flex
   print("Hello, World!")
   ```
3. Click "Run" to execute

#### Using Command Line
1. Create a file named `hello.lx` with the following content:
   ```flex
   print("Hello, World!")
   ```

2. Run the program:
   - **Unix-like systems (macOS, Linux):**
     ```bash
     ./flex.sh hello.lx
     ```
   - **Windows:**
     ```bash
     flex.bat hello.lx
     ```

## Language Reference

### File Extensions
Flex programs typically use the `.lx` file extension, though `.txt` files are also supported for compatibility.

### Comments
```flex
# This is a single-line comment
# Comments start with the hash symbol
```

### Data Types and Variables

Flex supports several data types with both explicit type annotations and type inference:

| Type | Keyword | Declaration Examples | Description |
|------|---------|---------------------|-------------|
| **Integer** | `rakm` | `rakm x = 10` | Whole numbers |
| **Float** | `rakm` | `rakm y = 3.14` | Decimal numbers |
| **String** | *inferred* | `s = "Hello"` | Text enclosed in quotes |
| **Boolean** | *inferred* | `b = true` | `true` or `false` values |
| **Array/List** | `dorg` | `dorg arr = [1, 2, 3]` | Collection of items |

#### Variable Declaration Patterns

```flex
# Explicit type annotation
rakm age = 25
rakm pi = 3.14159

# Type inference (recommended for simple cases)
name = "Alice"
is_active = true
score = 95.5

# Array/List declaration
dorg numbers = [1, 2, 3, 4, 5]
dorg names = ["Alice", "Bob", "Charlie"]
dorg mixed = [1, "hello", true, 3.14]
```

#### String Features

```flex
# Basic string assignment
message = "Hello, World!"

# String interpolation using curly braces
name = "Alice"
greeting = "Hello, {name}!"  # Results in: "Hello, Alice!"

# Multi-variable interpolation
x = 10
y = 20
result = "The sum of {x} and {y} is {x + y}"
```

### Operators

#### Arithmetic Operators

| Operator | Description | Example | Result |
|----------|-------------|---------|--------|
| `+` | Addition | `5 + 3` | `8` |
| `-` | Subtraction | `5 - 3` | `2` |
| `*` | Multiplication | `5 * 3` | `15` |
| `/` | Division | `10 / 2` | `5` |
| `%` | Modulus (remainder) | `10 % 3` | `1` |
| `++` | Increment | `x++` | Increases x by 1 |
| `--` | Decrement | `x--` | Decreases x by 1 |

#### Comparison Operators

| Operator | Description | Example | Usage |
|----------|-------------|---------|-------|
| `==` | Equal to | `x == y` | Check if values are equal |
| `!=` | Not equal to | `x != y` | Check if values are different |
| `>` | Greater than | `x > y` | Check if x is greater than y |
| `<` | Less than | `x < y` | Check if x is less than y |
| `>=` | Greater than or equal | `x >= y` | Check if x is greater than or equal to y |
| `<=` | Less than or equal | `x <= y` | Check if x is less than or equal to y |

#### Logical Operators

| Operator | Description | Example | Usage |
|----------|-------------|---------|-------|
| `&&` | Logical AND | `x && y` | True if both x and y are true |
| `||` | Logical OR | `x || y` | True if either x or y is true |
| `!` | Logical NOT | `!x` | True if x is false, false if x is true |

### Control Structures

#### Conditional Statements

```flex
# Basic if statement
if (condition) {
    # code to execute if condition is true
}

# If-else statement
if (age >= 18) {
    print("You are an adult")
} else {
    print("You are a minor")
}

# Multiple conditions with else if
score = 85
if (score >= 90) {
    print("Grade: A")
} else if (score >= 80) {
    print("Grade: B")
} else if (score >= 70) {
    print("Grade: C")
} else {
    print("Grade: F")
}

# Nested conditions
if (age >= 18) {
    if (has_license) {
        print("Can drive")
    } else {
        print("Cannot drive without license")
    }
}
```

#### Loops

##### For Loop
```flex
# Basic for loop
for (i = 0; i < 5; i++) {
    print("Iteration: {i}")
}

# Loop with different step
for (i = 0; i <= 10; i += 2) {
    print("Even number: {i}")
}

# Countdown loop
for (i = 10; i > 0; i--) {
    print("Countdown: {i}")
}

# Nested loops
for (i = 1; i <= 3; i++) {
    for (j = 1; j <= 3; j++) {
        print("i={i}, j={j}")
    }
}
```

##### While Loop
```flex
# Basic while loop
i = 0
while (i < 5) {
    print("Count: {i}")
    i++
}

# While loop with condition
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

##### Loop Control Statements
```flex
# Break statement - exit the loop immediately
for (i = 0; i < 10; i++) {
    if (i == 5) {
        print("Breaking at 5")
        break
    }
    print("Number: {i}")
}

# Continue statement - skip to next iteration
for (i = 0; i < 10; i++) {
    if (i % 2 == 0) {
        continue  # Skip even numbers
    }
    print("Odd number: {i}")
}
```

### Functions

Functions in Flex are defined using the `sndo2` keyword and can return values using `rg3`:

#### Basic Function Syntax
```flex
sndo2 function_name(parameters) {
    # function body
    rg3 return_value  # optional return statement
}
```

#### Function Examples

```flex
# Simple function with no parameters
sndo2 greet() {
    print("Hello from a function!")
}

# Call the function
greet()

# Function with parameters
sndo2 greet_person(name) {
    print("Hello, {name}!")
}

greet_person("Alice")

# Function with multiple parameters
sndo2 add_numbers(a, b) {
    sum = a + b
    rg3 sum
}

result = add_numbers(5, 3)
print("5 + 3 = {result}")

# Function with typed parameters
sndo2 multiply(rakm x, rakm y) {
    rg3 x * y
}

product = multiply(4, 7)
print("4 * 7 = {product}")

# Function with default behavior
sndo2 power(base, exponent) {
    if (exponent == 0) {
        rg3 1
    }
    result = 1
    for (i = 0; i < exponent; i++) {
        result = result * base
    }
    rg3 result
}

print("2^3 = {power(2, 3)}")
```

#### Recursive Functions
```flex
sndo2 factorial(n) {
    if (n <= 1) {
        rg3 1
    }
    rg3 n * factorial(n - 1)
}

result = factorial(5)
print("5! = {result}")  # Output: 5! = 120

# Fibonacci sequence
sndo2 fibonacci(n) {
    if (n <= 1) {
        rg3 n
    }
    rg3 fibonacci(n - 1) + fibonacci(n - 2)
}

print("Fibonacci sequence:")
for (i = 0; i < 10; i++) {
    print("F({i}) = {fibonacci(i)}")
}
```

### Input and Output

#### Output Functions

```flex
# Basic print function
print("Hello, World!")

# Print with line break (etb3)
etb3("This adds an extra line break")

# String interpolation in print statements
name = "Alice"
age = 25
print("Name: {name}, Age: {age}")

# Printing different data types
rakm number = 42
boolean_value = true
dorg list_example = [1, 2, 3]

print("Number: {number}")
print("Boolean: {boolean_value}")
print("List: {list_example}")
```

#### Input Functions

```flex
# Basic input function
print("Enter your name:")
name = da5l()
print("Hello, {name}!")

# Alternative input function
print("Enter your age:")
age_str = input()

# Converting string input to number
if (age_str.isdigit()) {
    age = int(age_str)
    print("You are {age} years old")
} else {
    print("Invalid age entered")
}

# Input validation example
sndo2 get_valid_number() {
    while (true) {
        print("Enter a number:")
        input_str = da5l()
        if (input_str.isdigit()) {
            rg3 int(input_str)
        }
        print("Invalid input. Please enter a valid number.")
    }
}

number = get_valid_number()
print("You entered: {number}")
```

### Working with Arrays and Lists

Arrays in Flex are created using the `dorg` keyword and support various operations:

```flex
# Creating arrays
dorg numbers = [1, 2, 3, 4, 5]
dorg names = ["Alice", "Bob", "Charlie"]
dorg mixed = [1, "hello", true, 3.14]

# Accessing elements (zero-indexed)
first_number = numbers[0]  # Gets 1
second_name = names[1]     # Gets "Bob"

print("First number: {first_number}")
print("Second name: {second_name}")

# Modifying elements
numbers[2] = 30  # Changes third element from 3 to 30
names[0] = "Alex"  # Changes "Alice" to "Alex"

# Array operations in loops
print("All numbers:")
for (i = 0; i < 5; i++) {
    print("numbers[{i}] = {numbers[i]}")
}

# Array processing functions
sndo2 sum_array(arr, size) {
    total = 0
    for (i = 0; i < size; i++) {
        total = total + arr[i]
    }
    rg3 total
}

total = sum_array(numbers, 5)
print("Sum of numbers: {total}")

sndo2 find_max(arr, size) {
    if (size == 0) {
        rg3 0
    }
    
    max_val = arr[0]
    for (i = 1; i < size; i++) {
        if (arr[i] > max_val) {
            max_val = arr[i]
        }
    }
    rg3 max_val
}

max_number = find_max(numbers, 5)
print("Maximum number: {max_number}")
```

### File Operations and Imports

#### Importing Files

Use the `geeb` keyword to import code from other Flex files:

```flex
# Import a file with utility functions
geeb "math_utils.lx"

# Import a file with constants
geeb "constants.lx"

# Now you can use functions and variables from imported files
result = add(10, 5)  # Assuming add() is defined in math_utils.lx
```

#### Modular Programming Example

**math_utils.lx:**
```flex
sndo2 add(a, b) {
    rg3 a + b
}

sndo2 subtract(a, b) {
    rg3 a - b
}

sndo2 multiply(a, b) {
    rg3 a * b
}

sndo2 divide(a, b) {
    if (b == 0) {
        print("Error: Division by zero!")
        rg3 0
    }
    rg3 a / b
}

sndo2 power(base, exponent) {
    result = 1
    for (i = 0; i < exponent; i++) {
        result = result * base
    }
    rg3 result
}
```

**calculator.lx:**
```flex
geeb "math_utils.lx"

print("=== Flex Calculator ===")

x = 10
y = 5

print("Calculations with {x} and {y}:")
print("Addition: {x} + {y} = {add(x, y)}")
print("Subtraction: {x} - {y} = {subtract(x, y)}")
print("Multiplication: {x} * {y} = {multiply(x, y)}")
print("Division: {x} / {y} = {divide(x, y)}")
print("Power: {x}^{y} = {power(x, y)}")
```

### Error Handling and Debugging

#### AI-Assisted Error Handling

Flex provides AI-powered error analysis to help identify and fix issues:

```bash
# Enable AI assistance (Unix/Linux/macOS)
export USE_AI=true
./flex.sh your_program.lx

# Enable AI assistance (Windows)
set USE_AI=true
flex.bat your_program.lx
```

#### Common Error Types and Solutions

| Error Type | Description | Example | Solution |
|------------|-------------|---------|----------|
| **SyntaxError** | Invalid syntax or structure | Missing `{` or `}` | Check brackets, parentheses, and syntax |
| **NameError** | Undefined variable or function | Using `x` before declaring it | Declare variables before use |
| **TypeError** | Invalid operation on data type | Adding string + number | Convert types or fix operation |
| **ZeroDivisionError** | Division by zero | `x / 0` | Add conditional check for zero |
| **IndexError** | Array index out of bounds | `arr[10]` for 5-element array | Check array bounds |

#### Error Prevention Best Practices

```flex
# Input validation
sndo2 safe_divide(a, b) {
    if (b == 0) {
        print("Warning: Cannot divide by zero")
        rg3 0
    }
    rg3 a / b
}

# Array bounds checking
sndo2 safe_get_element(arr, index, size) {
    if (index < 0 || index >= size) {
        print("Debug: Invalid index {index} for array of size {size}")
        rg3 0
    }
    rg3 arr[index]
}

# Type checking for input
sndo2 get_integer_input(prompt) {
    print(prompt)
    while (true) {
        input_str = da5l()
        if (input_str.isdigit()) {
            rg3 int(input_str)
        }
        print("Please enter a valid integer:")
    }
}
```

## Advanced Features

### Complex Data Structures

#### Working with Multi-dimensional Arrays
```flex
# Create a 2D array representation
dorg matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]

# Note: Currently simulated as nested function calls
sndo2 get_matrix_element(matrix, row, col) {
    row_data = matrix[row]
    rg3 row_data[col]
}

sndo2 print_matrix(matrix, rows, cols) {
    for (i = 0; i < rows; i++) {
        row_str = ""
        for (j = 0; j < cols; j++) {
            element = get_matrix_element(matrix, i, j)
            row_str = row_str + element + " "
        }
        print(row_str)
    }
}

print_matrix(matrix, 3, 3)
```

#### String Processing Functions
```flex
sndo2 string_length(str) {
    # Simple string length calculation
    length = 0
    # Implementation would depend on string methods
    rg3 length
}

sndo2 string_contains(haystack, needle) {
    # Check if string contains substring
    # Implementation depends on string methods
    rg3 false
}

sndo2 reverse_string(str) {
    # Reverse a string
    # Implementation would use string methods
    rg3 str
}
```

### Algorithm Examples

#### Sorting Algorithms
```flex
sndo2 bubble_sort(arr, size) {
    for (i = 0; i < size - 1; i++) {
        for (j = 0; j < size - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                # Swap elements
                temp = arr[j]
                arr[j] = arr[j + 1]
                arr[j + 1] = temp
            }
        }
    }
}

# Example usage
dorg numbers = [64, 34, 25, 12, 22, 11, 90]
print("Original array: {numbers}")
bubble_sort(numbers, 7)
print("Sorted array: {numbers}")
```

#### Search Algorithms
```flex
sndo2 linear_search(arr, size, target) {
    for (i = 0; i < size; i++) {
        if (arr[i] == target) {
            rg3 i
        }
    }
    rg3 -1  # Not found
}

sndo2 binary_search(arr, size, target) {
    left = 0
    right = size - 1
    
    while (left <= right) {
        mid = (left + right) / 2
        
        if (arr[mid] == target) {
            rg3 mid
        } else if (arr[mid] < target) {
            left = mid + 1
        } else {
            right = mid - 1
        }
    }
    rg3 -1  # Not found
}
```

## Best Practices and Style Guide

### Code Organization

1. **File Structure:**
   ```
   project/
   ├── main.lx           # Entry point
   ├── utils/
   │   ├── math.lx       # Mathematical functions
   │   ├── string.lx     # String utilities
   │   └── validation.lx # Input validation
   └── data/
       └── constants.lx  # Application constants
   ```

2. **Naming Conventions:**
   - Use descriptive variable names: `user_age` instead of `a`
   - Use snake_case for variables and functions: `calculate_total`
   - Use ALL_CAPS for constants: `MAX_SIZE = 100`

3. **Function Design:**
   ```flex
   # Good: Single responsibility, clear purpose
   sndo2 calculate_circle_area(radius) {
       pi = 3.14159
       rg3 pi * radius * radius
   }
   
   # Better: With validation
   sndo2 safe_calculate_circle_area(radius) {
       if (radius <= 0) {
           print("Error: Radius must be positive")
           rg3 0
       }
       pi = 3.14159
       rg3 pi * radius * radius
   }
   ```

### Performance Considerations

1. **Efficient Loops:**
   ```flex
   # Efficient: Minimize operations inside loops
   size = 1000
   for (i = 0; i < size; i++) {
       # Process arr[i]
   }
   
   # Avoid: Recalculating size in each iteration
   for (i = 0; i < arr.length(); i++) {  # If length() was expensive
       # Process arr[i]
   }
   ```

2. **Memory Usage:**
   ```flex
   # Be mindful of large arrays
   dorg large_array = [...]  # Consider memory implications
   
   # Reuse variables when possible
   temp = 0
   for (i = 0; i < size; i++) {
       temp = complex_calculation(i)
       result = result + temp
   }
   ```

### Debugging Tips

1. **Add Debug Prints:**
   ```flex
   sndo2 debug_function(x, y) {
       print("Debug: function called with x={x}, y={y}")
       result = x + y
       print("Debug: result = {result}")
       rg3 result
   }
   ```

2. **Validate Inputs:**
   ```flex
   sndo2 safe_array_access(arr, index, size) {
       if (index < 0 || index >= size) {
           print("Debug: Invalid index {index} for array of size {size}")
           rg3 0
       }
       rg3 arr[index]
   }
   ```

3. **Use Incremental Development:**
   ```flex
   # Start simple
   sndo2 basic_function() {
       print("Function works!")
   }
   
   # Add complexity gradually
   sndo2 enhanced_function(param) {
       print("Function works with param: {param}")
       # Add more functionality step by step
   }
   ```

## Example Programs

### Example 1: Number Guessing Game
```flex
# Number guessing game
sndo2 number_guessing_game() {
    secret = 42  # In a real game, this would be random
    max_attempts = 5
    
    print("=== Number Guessing Game ===")
    print("I'm thinking of a number between 1 and 100")
    print("You have {max_attempts} attempts to guess it!")
    
    for (attempt = 1; attempt <= max_attempts; attempt++) {
        print("\nAttempt {attempt}/{max_attempts}")
        print("Enter your guess:")
        guess_str = da5l()
        
        if (guess_str.isdigit()) {
            guess = int(guess_str)
            
            if (guess == secret) {
                print("Congratulations! You guessed it!")
                rg3
            } else if (guess < secret) {
                print("Too low!")
            } else {
                print("Too high!")
            }
        } else {
            print("Please enter a valid number!")
        }
    }
    
    print("Game over! The number was {secret}")
}

number_guessing_game()
```

### Example 2: Simple Banking System
```flex
# Simple banking system
balance = 1000.0

sndo2 display_balance() {
    print("Current balance: ${balance}")
}

sndo2 deposit(amount) {
    if (amount > 0) {
        balance = balance + amount
        print("Deposited ${amount}")
        display_balance()
    } else {
        print("Invalid deposit amount")
    }
}

sndo2 withdraw(amount) {
    if (amount > 0 && amount <= balance) {
        balance = balance - amount
        print("Withdrew ${amount}")
        display_balance()
    } else if (amount > balance) {
        print("Insufficient funds")
    } else {
        print("Invalid withdrawal amount")
    }
}

sndo2 banking_menu() {
    while (true) {
        print("\n=== Banking System ===")
        print("1. Check Balance")
        print("2. Deposit")
        print("3. Withdraw") 
        print("4. Exit")
        print("Enter your choice:")
        
        choice = da5l()
        
        if (choice == "1") {
            display_balance()
        } else if (choice == "2") {
            print("Enter deposit amount:")
            amount_str = da5l()
            if (amount_str.isdigit()) {
                deposit(int(amount_str))
            } else {
                print("Invalid amount")
            }
        } else if (choice == "3") {
            print("Enter withdrawal amount:")
            amount_str = da5l()
            if (amount_str.isdigit()) {
                withdraw(int(amount_str))
            } else {
                print("Invalid amount")
            }
        } else if (choice == "4") {
            print("Thank you for using our banking system!")
            break
        } else {
            print("Invalid choice. Please try again.")
        }
    }
}

banking_menu()
```

## Web IDE Features

The Flex Web IDE provides a complete development environment with:

### Editor Features
- **Syntax highlighting** for Flex language keywords
- **Real-time error detection** with AI assistance
- **Auto-indentation** and code formatting
- **Code sharing** via URL hash
- **Local storage** for code persistence

### Execution Environment
- **Real-time compilation** and execution
- **Interactive input/output** with queue management
- **WebSocket communication** for instant feedback
- **Error reporting** with AI-powered suggestions

### Development Tools
- **Built-in examples** for learning
- **Documentation integration** within the IDE
- **Code export** and import capabilities
- **Responsive design** for mobile development

## Contributing to Flex

### Development Setup
1. Fork the repository
2. Set up the development environment
3. Read the contributor guidelines
4. Submit pull requests with clear descriptions

### Areas for Contribution
- **Language features:** New syntax, operators, built-in functions
- **Standard library:** Utility functions, data structures
- **IDE improvements:** Editor enhancements, debugging tools
- **Documentation:** Examples, tutorials, API reference
- **Testing:** Unit tests, integration tests, example programs

## Appendix

### Keyword Reference

| Keyword | Purpose | Example |
|---------|---------|---------|
| `rakm` | Type annotation for numbers | `rakm x = 10` |
| `dorg` | Array/list declaration | `dorg arr = [1, 2, 3]` |
| `sndo2` | Function definition | `sndo2 func() { }` |
| `rg3` | Return statement | `rg3 value` |
| `geeb` | File import | `geeb "file.lx"` |
| `da5l` | Input function | `name = da5l()` |
| `etb3` | Print with line break | `etb3("text")` |

### Built-in Functions Reference

| Function | Purpose | Example |
|----------|---------|---------|
| `print()` | Output text | `print("Hello")` |
| `da5l()` | Get user input | `input = da5l()` |
| `input()` | Alternative input function | `data = input()` |
| `etb3()` | Print with extra line break | `etb3("text")` |
| `int()` | Convert to integer | `num = int("42")` |
| `isdigit()` | Check if string is numeric | `"42".isdigit()` |

### Common Patterns

#### Error Handling Pattern
```flex
sndo2 safe_operation(input) {
    if (input == null || input == "") {
        print("Error: Invalid input")
        rg3 false
    }
    # Perform operation
    rg3 true
}
```

#### Validation Pattern
```flex
sndo2 validate_range(value, min, max) {
    rg3 value >= min && value <= max
}
```

#### Iteration Pattern
```flex
sndo2 process_array(arr, size) {
    for (i = 0; i < size; i++) {
        # Process arr[i]
    }
}
```

## License

Flex is released under the [MIT License](https://opensource.org/licenses/MIT). 