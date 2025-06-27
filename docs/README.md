# Flex Programming Language

Welcome to the **Flex Online Compiler**! This is your gateway to learning and using the Flex programming language.

## Getting Started

Flex is a modern programming language designed for simplicity and performance. The online compiler provides a complete development environment with real-time execution and interactive capabilities.

### Your First Program

```flex
print("Hello, World!")
```

### Variables and Data Types

```flex
// Variable declaration
rakm x = 10          // Integer variable  
y = 20               // Type inference
name = "Flex"        // String variable
is_valid = true      // Boolean variable
```

### String Interpolation

Flex supports modern string interpolation using `{variable}` syntax:

```flex
x = 10
y = 20
print("The sum of {x} and {y} is {x + y}")
```

### Control Structures

#### Conditional Statements
```flex
age = 18
if (age >= 18) {
    print("You are an adult")
} else {
    print("You are a minor")
}
```

#### Loops
```flex
// For loop
for (i = 0; i < 5; i++) {
    print("Iteration: {i}")
}

// While loop
rakm count = 0
while (count < 3) {
    print("Count: {count}")
    count = count + 1
}
```

### Functions

```flex
function greet(name) {
    return "Hello, {name}!"
}

result = greet("World")
print(result)
```

### Interactive Input

Flex provides two functions for user input:

- `da5l()` - Reads user input (preferred method)
- `input()` - Alternative input method

```flex
print("What is your name?")
name = da5l()
print("Hello, {name}!")
```

## Features

- **Type Inference**: Automatic type detection
- **String Interpolation**: Modern `{variable}` syntax in strings  
- **Interactive I/O**: Real-time input via `da5l()` and `input()` functions
- **Modern Syntax**: C-style control structures
- **Real-time Execution**: Compiled and executed in web environment

## Online Compiler Features

- **Real-time Code Editor**: Syntax highlighting with Dracula theme
- **Instant Execution**: Run code with Ctrl+Enter
- **Interactive Input**: Queue multiple inputs in advance
- **Code Sharing**: Share your code via URL
- **Examples**: Built-in sample programs
- **WebSocket Communication**: Live program interaction

## Keyboard Shortcuts

- **Ctrl + Enter**: Run code
- **Ctrl + S**: Save code to browser storage  
- **Tab**: Insert 4 spaces
- **Ctrl + /**: Toggle comment
- **Ctrl + Z**: Undo
- **Ctrl + Y**: Redo

## Next Steps

1. Try the built-in examples in the Examples section
2. Experiment with the interactive input features
3. Check out the Quick Reference for more syntax details
4. Read the full Tutorial for comprehensive learning

Happy coding with Flex! 