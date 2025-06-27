// Define a CodeMirror mode for the Flex programming language
CodeMirror.defineMode("flex", function () {
  // Define all keywords from the grammar
  const types = /^(rakm|kasr|so2al|klma|dorg|int|float|bool|string|list)\b/;
  const booleans = /^(sa7|ghalt|true|false|True|False)\b/;
  const printFunctions = /^(etb3|out|output|print|printf|cout)\b/;
  const inputFunctions = /^(scan|read|input|da5l|da5al|d5l)\b/;
  const functionKeywords = /^(fun|sndo2|sando2|fn|function)\b/;
  const returnKeywords = /^(rg3|return)\b/;
  const conditionalKeywords = /^(lw|aw|gher|if|cond|elif|else|otherwise)\b/;
  const loopKeywords = /^(karr|l7d|for|talama|talma|tlma|while|loop)\b/;
  const controlKeywords = /^(w2f|break|continue)\b/;
  const importKeywords = /^(geep|geeb|import)\b/;

  // Combine all keywords for general keyword detection
  const allKeywords = /^(rakm|kasr|so2al|klma|dorg|int|float|bool|string|list|sa7|ghalt|true|false|True|False|etb3|out|output|print|printf|cout|scan|read|input|da5l|da5al|d5l|fun|sndo2|sando2|fn|function|rg3|return|lw|aw|gher|if|cond|elif|else|otherwise|karr|l7d|for|talama|talma|tlma|while|loop|w2f|break|continue|geep|geeb|import)\b/;

  // Define operators from the grammar
  const operators = /^(\+\+|\--|\+|\-|\*|\/|==|!=|>=|<=|>|<|=)/;

  // Define comparison operators
  const comparisons = /^(==|!=|>=|<=|>|<)\b/;

  return {
    startState: function () {
      return {
        inString: false,
        stringDelimiter: null,
        inMultiLineComment: false,
        inPythonMultiLineComment: false,
        inStringInterpolation: false,
        interpolationDepth: 0
      };
    },

    token: function (stream, state) {
      // Handle C-style multi-line comments /* */
      if (state.inMultiLineComment) {
        if (stream.match("*/")) {
          state.inMultiLineComment = false;
          return "comment";
        }
        stream.next();
        return "comment";
      }

      // Handle Python-style multi-line comments ''' '''
      if (state.inPythonMultiLineComment) {
        if (stream.match("'''")) {
          state.inPythonMultiLineComment = false;
          return "comment";
        }
        stream.next();
        return "comment";
      }

      // Handle whitespace
      if (stream.eatSpace()) return null;

      // Check for single-line comments (# and //)
      if (stream.match("#") || stream.match("//")) {
        stream.skipToEnd();
        return "comment";
      }

      // Check for multi-line comment start
      if (stream.match("/*")) {
        state.inMultiLineComment = true;
        return "comment";
      }

      // Check for Python-style multi-line comment start
      if (stream.match("'''")) {
        state.inPythonMultiLineComment = true;
        return "comment";
      }

      // Handle string interpolation inside strings
      if (state.inString && stream.peek() === '{') {
        stream.next(); // consume '{'
        state.inStringInterpolation = true;
        state.interpolationDepth = 1;
        return "string-2"; // Different style for interpolation brackets
      }

      // Handle end of string interpolation
      if (state.inStringInterpolation && stream.peek() === '}') {
        state.interpolationDepth--;
        if (state.interpolationDepth === 0) {
          state.inStringInterpolation = false;
          stream.next(); // consume '}'
          return "string-2";
        }
      }

      // Handle nested braces in interpolation
      if (state.inStringInterpolation && stream.peek() === '{') {
        state.interpolationDepth++;
      }

      // Inside string interpolation, parse as normal code
      if (state.inStringInterpolation) {
        // Handle keywords inside interpolation
        if (stream.match(allKeywords)) {
          return "keyword";
        }

        // Handle numbers inside interpolation
        if (stream.match(/^-?\d+(\.\d+)?/)) {
          return "number";
        }

        // Handle operators inside interpolation
        if (stream.match(operators)) {
          return "operator";
        }

        // Handle identifiers inside interpolation
        if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
          return "variable";
        }

        // Handle other characters in interpolation
        stream.next();
        return "variable";
      }

      // Handle strings
      if (!state.inString && stream.peek() === '"') {
        stream.next(); // consume opening quote
        state.inString = true;
        state.stringDelimiter = '"';
        return "string";
      }

      // Continue string
      if (state.inString) {
        if (stream.peek() === state.stringDelimiter) {
          stream.next(); // consume closing quote
          state.inString = false;
          state.stringDelimiter = null;
          return "string";
        } else if (stream.peek() === '\\') {
          stream.next(); // consume backslash
          stream.next(); // consume escaped character
          return "string";
        } else if (stream.peek() === '{') {
          // Don't consume the {, let it be handled by interpolation logic above
          return "string";
        } else {
          stream.next();
          return "string";
        }
      }

      // Handle numbers (integers and floats)
      if (stream.match(/^-?\d+\.\d+/)) {
        return "number";
      }
      if (stream.match(/^-?\d+/)) {
        return "number";
      }

      // Handle different types of keywords with specific styling
      if (stream.match(types)) {
        return "type";
      }

      if (stream.match(booleans)) {
        return "atom";
      }

      if (stream.match(printFunctions)) {
        return "builtin";
      }

      if (stream.match(inputFunctions)) {
        return "builtin";
      }

      if (stream.match(functionKeywords)) {
        return "def";
      }

      if (stream.match(returnKeywords)) {
        return "keyword";
      }

      if (stream.match(conditionalKeywords)) {
        return "keyword";
      }

      if (stream.match(loopKeywords)) {
        return "keyword";
      }

      if (stream.match(controlKeywords)) {
        return "keyword";
      }

      if (stream.match(importKeywords)) {
        return "meta";
      }

      // Handle comparison operators
      if (stream.match(comparisons)) {
        return "operator";
      }

      // Handle other operators
      if (stream.match(operators)) {
        return "operator";
      }

      // Handle function calls (identifier followed by parentheses)
      const pos = stream.pos;
      if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
        if (stream.peek() === '(') {
          return "variable-2"; // Function name style
        } else {
          return "variable";
        }
      }
      stream.pos = pos; // Reset position if no match

      // Handle identifiers (variables)
      if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
        return "variable";
      }

      // Handle brackets and punctuation
      if (stream.match(/[\[\]]/)) {
        return "bracket";
      }

      if (stream.match(/[\(\)]/)) {
        return "bracket";
      }

      if (stream.match(/[\{\}]/)) {
        return "bracket";
      }

      if (stream.match(/[,;]/)) {
        return "punctuation";
      }

      // Fallback for any other character
      stream.next();
      return null;
    }
  };
});

// Register the mode with a MIME type
CodeMirror.defineMIME("text/x-flex", "flex");

// Also register with common flex extensions
CodeMirror.defineMIME("text/x-lx", "flex"); 