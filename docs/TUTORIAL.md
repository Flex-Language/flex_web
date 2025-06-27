# Flex Programming Tutorial

Welcome to the comprehensive Flex programming tutorial! This guide will take you from beginner to proficient in the Flex programming language.

## Table of Contents

1. [Introduction](#introduction)
2. [Your First Program](#your-first-program)
3. [Variables and Data Types](#variables-and-data-types)
4. [Operators](#operators)
5. [Control Flow](#control-flow)
6. [Functions](#functions)
7. [Input and Output](#input-and-output)
8. [Advanced Features](#advanced-features)
9. [Practice Exercises](#practice-exercises)

## Introduction

Flex is a modern programming language designed for simplicity and performance. It combines the ease of use found in scripting languages with the structure of compiled languages.

### Key Features:
- **Type Inference**: Variables automatically detect their type
- **String Interpolation**: Easy variable insertion in strings
- **Interactive I/O**: Real-time input/output capabilities
- **Modern Syntax**: Clean, readable code structure

## Your First Program

Let's start with the classic "Hello, World!" program:

```flex
print("Hello, World!")
```

That's it! Run this code and you'll see the output in the console.

### Exercise 1.1
Try modifying the message to print your name:
```flex
print("Hello, [Your Name]!")
```

## Variables and Data Types

### Variable Declaration

In Flex, you can declare variables in two ways:

1. **Explicit declaration** with `rakm`:
```flex
rakm x = 10
```

2. **Type inference** (recommended):
```flex
x = 10        // Integer
name = "John" // String  
is_valid = true // Boolean
```

### Data Types

#### Numbers
```flex
age = 25              // Integer
height = 5.8          // Float
temperature = -10     // Negative number
```

#### Strings
```flex
name = "Alice"
message = 'Hello there'   // Single quotes also work
empty_string = ""
```

#### Booleans
```flex
is_student = true
is_working = false
```

### Exercise 2.1
Create variables for your personal information:
```flex
name = "Your Name"
age = 20
height = 5.5
is_student = true

print("Name: {name}")
print("Age: {age}")
print("Height: {height}")
print("Student: {is_student}")
```

## Operators

### Arithmetic Operators
```flex
a = 10
b = 3

sum = a + b          // 13
difference = a - b   // 7
product = a * b      // 30
quotient = a / b     // 3.33...
remainder = a % b    // 1
```

### Comparison Operators
```flex
x = 5
y = 10

print(x == y)        // false
print(x != y)        // true
print(x < y)         // true
print(x > y)         // false
print(x <= y)        // true
print(x >= y)        // false
```

### Logical Operators
```flex
is_adult = true
has_license = false

can_drive = is_adult && has_license  // false
can_vote = is_adult || has_license   // true
is_minor = !is_adult                 // false
```

### Exercise 3.1
Create a simple calculator:
```flex
a = 15
b = 4

print("Addition: {a} + {b} = {a + b}")
print("Subtraction: {a} - {b} = {a - b}")
print("Multiplication: {a} * {b} = {a * b}")
print("Division: {a} / {b} = {a / b}")
```

## Control Flow

### If Statements

```flex
age = 18

if (age >= 18) {
    print("You are an adult")
} else {
    print("You are a minor")
}
```

#### Multiple Conditions
```flex
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
```

### Loops

#### For Loops
```flex
// Basic for loop
for (i = 0; i < 5; i++) {
    print("Count: {i}")
}

// Countdown
for (i = 10; i > 0; i--) {
    print("Countdown: {i}")
}
```

#### While Loops
```flex
count = 0
while (count < 3) {
    print("Loop iteration: {count}")
    count = count + 1
}
```

### Exercise 4.1
Create a program that prints the multiplication table for a number:
```flex
number = 7
for (i = 1; i <= 10; i++) {
    result = number * i
    print("{number} x {i} = {result}")
}
```

## Functions

### Function Definition
```flex
function greet(name) {
    return "Hello, {name}!"
}

message = greet("Alice")
print(message)
```

### Functions with Multiple Parameters
```flex
function add(a, b) {
    return a + b
}

function multiply(x, y, z) {
    return x * y * z
}

sum = add(5, 3)           // 8
product = multiply(2, 3, 4) // 24
```

### Functions without Return Value
```flex
function printInfo(name, age) {
    print("Name: {name}")
    print("Age: {age}")
}

printInfo("Bob", 25)
```

### Exercise 5.1
Create a function to calculate the area of a rectangle:
```flex
function calculateArea(width, height) {
    return width * height
}

area = calculateArea(5, 3)
print("Area: {area} square units")
```

## Input and Output

### Output with print()
```flex
print("Simple message")
print("Number: {42}")

name = "Alice"
age = 25
print("Hello {name}, you are {age} years old")
```

### Input with da5l()

The `da5l()` function reads user input:

```flex
print("What is your name?")
name = da5l()
print("Hello, {name}!")
```

### Input Validation
```flex
print("Enter your age:")
age_input = da5l()

if (age_input.isdigit()) {
    age = int(age_input)
    print("You are {age} years old")
} else {
    print("Please enter a valid number")
}
```

### Exercise 6.1
Create an interactive program:
```flex
print("Personal Information Form")
print("---------------------------")

print("Enter your name:")
name = da5l()

print("Enter your age:")
age_str = da5l()
age = int(age_str)

print("Enter your city:")
city = da5l()

print("\n--- Your Information ---")
print("Name: {name}")
print("Age: {age}")
print("City: {city}")

if (age >= 18) {
    print("Status: Adult")
} else {
    print("Status: Minor")
}
```

## Advanced Features

### String Methods
```flex
text = "hello world"
upper_text = text.upper()        // "HELLO WORLD"
length = text.length()           // 11
contains_hello = text.contains("hello") // true
```

### Type Conversion
```flex
// String to number
number_str = "42"
number = int(number_str)

// Number to string  
age = 25
age_str = str(age)

// Check if string is a number
input = "123"
if (input.isdigit()) {
    print("Valid number")
}
```

### Complex Conditionals
```flex
age = 20
has_license = true
has_car = false

if (age >= 18 && has_license) {
    if (has_car) {
        print("You can drive your own car")
    } else {
        print("You can drive but need to borrow a car")
    }
} else {
    print("You cannot drive yet")
}
```

## Practice Exercises

### Exercise 7.1: Number Guessing Game
```flex
secret_number = 42
print("Guess the number (1-100):")

guess_str = da5l()
guess = int(guess_str)

if (guess == secret_number) {
    print("Congratulations! You guessed it!")
} else if (guess < secret_number) {
    print("Too low!")
} else {
    print("Too high!")
}
```

### Exercise 7.2: Simple Calculator
```flex
print("Simple Calculator")
print("Enter first number:")
a = int(da5l())

print("Enter operator (+, -, *, /):")
operator = da5l()

print("Enter second number:")
b = int(da5l())

if (operator == "+") {
    result = a + b
} else if (operator == "-") {
    result = a - b
} else if (operator == "*") {
    result = a * b
} else if (operator == "/") {
    result = a / b
} else {
    print("Invalid operator!")
    result = 0
}

if (operator == "+" || operator == "-" || operator == "*" || operator == "/") {
    print("Result: {a} {operator} {b} = {result}")
}
```

### Exercise 7.3: Fibonacci Sequence
```flex
print("Fibonacci sequence generator")
print("How many numbers do you want?")
n = int(da5l())

a = 0
b = 1

print("Fibonacci sequence:")
for (i = 0; i < n; i++) {
    if (i == 0) {
        print(a)
    } else if (i == 1) {
        print(b)
    } else {
        c = a + b
        print(c)
        a = b
        b = c
    }
}
```

## Tips for Using the Online Compiler

1. **Input Queue**: You can pre-enter multiple inputs in the input area before running your program
2. **Save Your Work**: Use Ctrl+S to save your code to browser storage
3. **Share Code**: Copy the URL after editing to share your code with others
4. **Keyboard Shortcuts**: Use Ctrl+Enter to run code quickly
5. **Examples**: Check out the Examples section for more sample programs

## Conclusion

Congratulations! You've learned the fundamentals of Flex programming. Practice with the exercises and experiment with the online compiler to improve your skills.

Key takeaways:
- Use meaningful variable names
- Comment your code for clarity
- Validate user input
- Break complex problems into smaller functions
- Practice regularly with different types of programs

Happy coding with Flex! 