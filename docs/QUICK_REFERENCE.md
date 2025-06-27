# Flex Quick Reference

## Variable Declaration

```flex
rakm x = 10          // Explicit declaration
y = 20               // Type inference
name = "John"        // String
is_active = true     // Boolean
```

## Data Types

| Type | Example | Description |
|------|---------|-------------|
| Integer | `42` | Whole numbers |
| String | `"Hello"` | Text in quotes |
| Boolean | `true`, `false` | True/false values |
| Float | `3.14` | Decimal numbers |

## Operators

### Arithmetic
```flex
+ - * / %            // Basic math
++ --                // Increment/decrement
```

### Comparison
```flex
== != < > <= >=      // Comparison operators
```

### Logical
```flex
&& || !              // AND, OR, NOT
```

## String Operations

### String Interpolation
```flex
name = "World"
message = "Hello, {name}!"
```

### String Methods
```flex
text = "hello"
upper_text = text.upper()    // "HELLO"
length = text.length()       // 5
```

## Control Flow

### If Statements
```flex
if (condition) {
    // code
} else if (other_condition) {
    // code  
} else {
    // code
}
```

### Loops
```flex
// For loop
for (i = 0; i < 10; i++) {
    print(i)
}

// While loop
while (condition) {
    // code
}
```

## Functions

### Function Definition
```flex
function functionName(param1, param2) {
    // code
    return result
}
```

### Function Call
```flex
result = functionName(arg1, arg2)
```

## Input/Output

### Output
```flex
print("Hello")           // Simple output
print("Value: {x}")      // With interpolation
```

### Input
```flex
name = da5l()            // Preferred input method
age = input()            // Alternative input method
```

## Comments

```flex
// Single line comment

/*
   Multi-line
   comment
*/
```

## Built-in Functions

| Function | Description | Example |
|----------|-------------|---------|
| `print()` | Output text | `print("Hello")` |
| `da5l()` | Read user input | `name = da5l()` |
| `input()` | Alternative input | `age = input()` |
| `int()` | Convert to integer | `num = int("42")` |
| `str()` | Convert to string | `text = str(42)` |
| `len()` | Get length | `len("hello")` |

## Common Patterns

### Input Validation
```flex
print("Enter a number:")
input_str = da5l()
if (input_str.isdigit()) {
    number = int(input_str)
    print("You entered: {number}")
} else {
    print("Invalid input!")
}
```

### Loop with Counter
```flex
for (i = 0; i < 5; i++) {
    print("Item {i + 1}")
}
```

### Simple Calculator
```flex
print("Enter first number:")
a = int(da5l())
print("Enter second number:")  
b = int(da5l())
sum = a + b
print("Result: {a} + {b} = {sum}")
```

## Best Practices

1. Use meaningful variable names
2. Add comments for complex logic  
3. Use `da5l()` for user input
4. Handle input validation
5. Use string interpolation for output formatting
6. Keep functions small and focused

## Error Handling

```flex
// Check for valid input
if (input_str.isdigit()) {
    // Process valid input
} else {
    print("Error: Invalid input")
}
```

## Online Compiler Tips

- Use the input queue to pre-enter multiple inputs
- Save your code with Ctrl+S
- Share code by copying the URL after editing
- Use the examples as templates for your programs 