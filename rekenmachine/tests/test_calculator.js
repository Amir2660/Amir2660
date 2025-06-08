const testResultsDiv = document.getElementById('test-results');
let testId = 1;

// --- Mocking Calculator UI interactions ---
// The calculator script directly interacts with the DOM (e.g. display.value).
// We need to simulate these interactions or parts of the script.

function simulateButtonClick(buttonValue) {
    if (buttonValue === 'C') {
        clearDisplay();
    } else if (['+', '-', '*', '/'].includes(buttonValue)) {
        setOperator(buttonValue);
    } else if (buttonValue === '=') {
        calculateResult();
    } else if (buttonValue === '.') {
        appendToDisplay(buttonValue); // Assuming appendToDisplay handles '.'
    } else { // Digit
        appendToDisplay(buttonValue);
    }
}

function getDisplayValue() {
    return document.getElementById('display').value;
}

function resetCalculatorState() {
    clearDisplay(); // This should reset internal state variables too
    // Explicitly reset if clearDisplay isn't enough for tests
    currentInput = '';
    previousInput = '';
    operator = null;
    shouldResetDisplay = false;
    document.getElementById('display').value = '';
}

// --- Assertion Functions ---
function assertEquals(expected, actual, message) {
    const resultDiv = document.createElement('div');
    if (expected === actual) {
        resultDiv.textContent = `PASS: ${testId++}. ${message} (Expected: ${expected}, Actual: ${actual})`;
        resultDiv.className = 'pass';
    } else {
        resultDiv.textContent = `FAIL: ${testId++}. ${message} (Expected: ${expected}, Actual: ${actual})`;
        resultDiv.className = 'fail';
        console.error(`FAIL: ${message} (Expected: ${expected}, Actual: ${actual})`);
    }
    testResultsDiv.appendChild(resultDiv);
}

function assertTrue(condition, message) {
    const resultDiv = document.createElement('div');
    if (condition) {
        resultDiv.textContent = `PASS: ${testId++}. ${message}`;
        resultDiv.className = 'pass';
    } else {
        resultDiv.textContent = `FAIL: ${testId++}. ${message}`;
        resultDiv.className = 'fail';
        console.error(`FAIL: ${message}`);
    }
    testResultsDiv.appendChild(resultDiv);
}

// --- Test Cases ---
function runTests() {
    testResultsDiv.innerHTML = '<h2>Running Tests...</h2>';

    // Test 1: Addition
    resetCalculatorState();
    simulateButtonClick('1');
    simulateButtonClick('2');
    simulateButtonClick('+');
    simulateButtonClick('3');
    simulateButtonClick('=');
    assertEquals('15', getDisplayValue(), "Test Addition: 12 + 3 = 15");

    // Test 2: Subtraction
    resetCalculatorState();
    simulateButtonClick('5');
    simulateButtonClick('-');
    simulateButtonClick('2');
    simulateButtonClick('=');
    assertEquals('3', getDisplayValue(), "Test Subtraction: 5 - 2 = 3");

    // Test 3: Multiplication
    resetCalculatorState();
    simulateButtonClick('7');
    simulateButtonClick('*');
    simulateButtonClick('8');
    simulateButtonClick('=');
    assertEquals('56', getDisplayValue(), "Test Multiplication: 7 * 8 = 56");

    // Test 4: Division
    resetCalculatorState();
    simulateButtonClick('9');
    simulateButtonClick('/');
    simulateButtonClick('3');
    simulateButtonClick('=');
    assertEquals('3', getDisplayValue(), "Test Division: 9 / 3 = 3");

    // Test 5: Clear Button
    resetCalculatorState();
    simulateButtonClick('1');
    simulateButtonClick('2');
    simulateButtonClick('C');
    assertEquals('', getDisplayValue(), "Test Clear Button: Display should be empty");
    assertTrue(currentInput === '' && previousInput === '' && operator === null, "Test Clear Button: Internal state reset");

    // Test 6: Division by Zero
    resetCalculatorState();
    simulateButtonClick('5');
    simulateButtonClick('/');
    simulateButtonClick('0');
    simulateButtonClick('=');
    assertEquals('Error: Division by zero', getDisplayValue(), "Test Division by Zero");

    // Test 7: Decimal Point and Operation
    resetCalculatorState();
    simulateButtonClick('1');
    simulateButtonClick('.');
    simulateButtonClick('5');
    simulateButtonClick('+');
    simulateButtonClick('2');
    simulateButtonClick('.');
    simulateButtonClick('5');
    simulateButtonClick('=');
    assertEquals('4', getDisplayValue(), "Test Decimal Addition: 1.5 + 2.5 = 4");

    // Test 8: Multiple Operations (Order of operations is sequential for this calculator)
    resetCalculatorState();
    simulateButtonClick('1');
    simulateButtonClick('0'); // 10
    simulateButtonClick('+');
    simulateButtonClick('5');  // 10 + 5 = 15
    simulateButtonClick('=');
    assertEquals('15', getDisplayValue(), "Test Multiple Ops Step 1: 10 + 5 = 15");
    simulateButtonClick('*'); // Result of previous (15) is previousInput
    simulateButtonClick('2');  // 15 * 2 = 30
    simulateButtonClick('=');
    assertEquals('30', getDisplayValue(), "Test Multiple Ops Step 2: 15 * 2 = 30");

    // Test 9: Operator change before equals
    resetCalculatorState();
    simulateButtonClick('1');
    simulateButtonClick('0'); // 10
    simulateButtonClick('+'); // op is +
    simulateButtonClick('5');  // current is 5
    simulateButtonClick('-'); // op changes to -, 10+5 should NOT be calculated. previousInput becomes 10, op is -
    // In current script.js: if (operator !== null && !shouldResetDisplay), it calculates.
    // This means 10+5 will be calculated if a number was entered after '+' and before '-'
    // Let's trace the state:
    // '1', '0' -> currentInput = "10", display="10"
    // '+'       -> previousInput="10", operator="+", shouldResetDisplay=true, currentInput=""
    // '5'       -> currentInput="5", display="5" (shouldResetDisplay was true, so display became "5")
    // '-'       -> calculateResult() is called (10+5=15). display="15". previousInput="15". operator="-". shouldResetDisplay=true. currentInput=""
    simulateButtonClick('2');  // currentInput="2", display="2"
    simulateButtonClick('=');  // 15 - 2 = 13
    assertEquals('13', getDisplayValue(), "Test Operator Change: 10 + 5 - 2 = 13"); // This depends on how setOperator handles existing operations

    // Test 10: Starting with an operator (should do nothing or not error)
    resetCalculatorState();
    simulateButtonClick('+');
    simulateButtonClick('5');
    simulateButtonClick('=');
    assertEquals('5', getDisplayValue(), "Test Starting with Operator: +5 = 5 (or just 5 if operator ignored)");
    // Current script: if currentInput is empty and previousInput is empty, setOperator returns.
    // So, '+' does nothing. Then '5' is input. '=' does nothing as operator is null.
    // This needs refinement in `script.js` or test adjustment.
    // For now, the expected behavior is that '5' is displayed.

    // Test 11: Repeated equals
    resetCalculatorState();
    simulateButtonClick('2');
    simulateButtonClick('+');
    simulateButtonClick('3');
    simulateButtonClick('='); // 2+3=5
    assertEquals('5', getDisplayValue(), "Test Repeated Equals Step 1: 2+3 = 5");
    simulateButtonClick('='); // Should either do nothing, repeat 5+3, or 5+original_current(3)
    // Current script: previousInput="5", currentInput="", operator=null, shouldResetDisplay=true
    // calculateResult() returns if operator is null. So display remains "5".
    assertEquals('5', getDisplayValue(), "Test Repeated Equals Step 2: Should remain 5");

    testResultsDiv.insertAdjacentHTML('afterbegin', '<h2>Test Run Complete</h2>');
}

// Run tests when the page loads
window.onload = runTests;
