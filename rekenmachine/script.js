const display = document.getElementById('display');
let currentInput = '';
let previousInput = '';
let operator = null;
let shouldResetDisplay = false;

function appendToDisplay(value) {
    if (shouldResetDisplay) {
        display.value = '';
        shouldResetDisplay = false;
    }
    if (value === '.' && display.value.includes('.')) return;
    display.value += value;
    currentInput = display.value;
}

function clearDisplay() {
    display.value = '';
    currentInput = '';
    previousInput = '';
    operator = null;
}

function calculateResult() {
    if (operator === null || previousInput === '' || currentInput === '') return;

    let result;
    const prev = parseFloat(previousInput);
    const current = parseFloat(currentInput);

    if (isNaN(prev) || isNaN(current)) {
        display.value = 'Error';
        shouldResetDisplay = true;
        return;
    }

    switch (operator) {
        case '+':
            result = prev + current;
            break;
        case '-':
            result = prev - current;
            break;
        case '*':
            result = prev * current;
            break;
        case '/':
            if (current === 0) {
                display.value = 'Error: Division by zero';
                shouldResetDisplay = true;
                return;
            }
            result = prev / current;
            break;
        default:
            return;
    }
    display.value = result;
    previousInput = result.toString();
    currentInput = ''; // Reset current input after calculation for new input
    operator = null; // Reset operator
    shouldResetDisplay = true; // Next number input should clear the display
}


// Event listeners for number and operator buttons will be added dynamically
// or by iterating through buttons in a more complex setup.
// For this example, the HTML directly calls these functions.

// Functions for operators
function setOperator(op) {
    if (currentInput === '' && previousInput === '') return; // No input yet

    if (operator !== null && !shouldResetDisplay) {
        // If an operator is already set and we haven't just calculated,
        // perform the calculation before setting the new operator.
        calculateResult();
    }

    // If display was reset (e.g. after a calculation), currentInput might be empty
    // but display.value holds the result which should become previousInput.
    if (currentInput === '' && display.value !== '' && !isNaN(parseFloat(display.value))) {
        previousInput = display.value;
    } else {
        previousInput = currentInput;
    }

    operator = op;
    shouldResetDisplay = true; // Next number input should start fresh
    currentInput = ''; // Clear currentInput for the next number
}

// Modify existing functions to use setOperator
// Original HTML calls:
// <button onclick="appendToDisplay('/')">/</button>
// <button onclick="appendToDisplay('*')">*</button>
// <button onclick="appendToDisplay('-')">-</button>
// <button onclick="appendToDisplay('+')">+</button>

// We need to adjust the HTML or add event listeners here.
// For simplicity, we'll assume the HTML is changed to call setOperator directly for operators.
// e.g., <button onclick="setOperator('+')">+</button>

// If we cannot change HTML, we'd add event listeners:
document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.buttons button');
    buttons.forEach(button => {
        const value = button.textContent;
        if (['+', '-', '*', '/'].includes(value)) {
            button.onclick = () => setOperator(value);
        }
        // Other buttons are already handled by their inline onclick or will be.
    });
});
