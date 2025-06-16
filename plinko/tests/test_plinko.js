let testsRun = 0;
let testsPassed = 0;
const testResultsDiv = document.getElementById('test-results');

function logResult(message, passed) {
    testsRun++;
    const p = document.createElement('p');
    p.textContent = message;
    if (passed) {
        testsPassed++;
        p.classList.add('pass');
    } else {
        p.classList.add('fail');
    }
    testResultsDiv.appendChild(p);
}

function assertEquals(expected, actual, message) {
    if (expected === actual) {
        logResult(`PASS: ${message} (Expected: ${expected}, Actual: ${actual})`, true);
    } else {
        logResult(`FAIL: ${message} (Expected: ${expected}, Actual: ${actual})`, false);
    }
}

function assertTrue(value, message) {
    if (value === true) {
        logResult(`PASS: ${message}`, true);
    } else {
        logResult(`FAIL: ${message} (Expected: true, Actual: ${value})`, false);
    }
}

function assertFalse(value, message) {
    if (value === false) {
        logResult(`PASS: ${message}`, true);
    } else {
        logResult(`FAIL: ${message} (Expected: false, Actual: ${value})`, false);
    }
}

function summarizeResults() {
    const summary = document.createElement('p');
    summary.classList.add('summary');
    summary.textContent = `Tests completed: ${testsPassed} passed out of ${testsRun}.`;
    if (testsPassed === testsRun) {
        summary.style.color = 'green';
    } else {
        summary.style.color = 'red';
    }
    testResultsDiv.appendChild(summary);
}


function runPlinkoTests() {
    // Ensure the game is initialized for testing (mocks DOM elements if not present)
    // This sets up boardElement, etc., within plinko.js to default sizes if not in browser
    window.plinkoGameApi.initGameForTest();

    testResultsDiv.innerHTML = '<h3>Running Plinko Tests...</h3>';

    // --- Test Initial State ---
    testResultsDiv.innerHTML += '<h4>Initial State Tests:</h4>';
    let initialState = window.plinkoGameApi.getGameState();
    assertEquals(100, initialState.playerScore, "Initial player score should be 100");
    assertEquals(10, initialState.COST_TO_PLAY, "COST_TO_PLAY should be defined and set to 10");
    assertTrue(initialState.PEG_ROWS > 0, "PEG_ROWS should be defined and positive");
    assertTrue(initialState.PEGS_PER_ROW_START > 0, "PEGS_PER_ROW_START should be defined and positive");
    assertTrue(Array.isArray(initialState.PRIZE_VALUES), "PRIZE_VALUES should be an array");
    assertTrue(initialState.PRIZE_VALUES.length > 0, "PRIZE_VALUES should not be empty");


    // --- Test Peg Creation ---
    testResultsDiv.innerHTML += '<h4>Peg Creation Tests:</h4>';
    // We need a boardElement for createPegs to run. initGameForTest should provide a mock.
    // If plinko.js's boardElement is null, createPegs won't run properly.
    // The mock boardElement needs clientWidth.
    const expectedPegs = (() => {
        let count = 0;
        for (let row = 0; row < initialState.PEG_ROWS; row++) {
            count += initialState.PEGS_PER_ROW_START + (row % 2 === 0 ? 0 : 1);
        }
        return count;
    })();
    const actualPegsCreated = window.plinkoGameApi.createPegs(); // this creates pegs on the mocked board
    assertEquals(expectedPegs, actualPegsCreated, `createPegs() should generate ${expectedPegs} pegs`);
    assertEquals(expectedPegs, window.plinkoGameApi.getGameState().pegs.length, "Pegs array should contain the created pegs");


    // --- Test Score Deduction ---
    testResultsDiv.innerHTML += '<h4>Score Deduction Tests:</h4>';
    window.plinkoGameApi.setPlayerScore(50); // Set a known score
    window.plinkoGameApi.dropBall(); // Attempt to drop a ball
    initialState = window.plinkoGameApi.getGameState(); // Get updated state
    assertEquals(50 - initialState.COST_TO_PLAY, initialState.playerScore, "Player score should be reduced by COST_TO_PLAY after dropBall");

    window.plinkoGameApi.setPlayerScore(5); // Set score below COST_TO_PLAY
    const dropResult = window.plinkoGameApi.dropBall(); // Attempt to drop
    assertFalse(dropResult, "dropBall() should return false if score is too low");
    initialState = window.plinkoGameApi.getGameState();
    assertEquals(5, initialState.playerScore, "Player score should not change if dropBall fails due to low score");


    // --- Test Prize Determination (Simplified) ---
    testResultsDiv.innerHTML += '<h4>Prize Determination Tests:</h4>';
    const prizeValues = initialState.PRIZE_VALUES;
    const numSlots = document.querySelectorAll('#prize-slots .prize-slot').length || initialState.PRIZE_VALUES.length; // Use PRIZE_VALUES.length as fallback
    const mockBoardWidth = 700; // Updated to match new board width and test_runner.html mock

    // Test landing in first slot
    window.plinkoGameApi.setPlayerScore(100); // Reset score
    const costToPlay = initialState.COST_TO_PLAY;
    let ballX_slot1 = (mockBoardWidth / numSlots) * 0.5; // Middle of first slot
    let wonAmount1 = window.plinkoGameApi.determinePrize(ballX_slot1);
    let expectedWonAmount1 = Math.round(costToPlay * prizeValues[0]);
    assertEquals(expectedWonAmount1, wonAmount1, `Points for slot 1 (multiplier ${prizeValues[0]}, X=${ballX_slot1.toFixed(0)}) should be ${expectedWonAmount1}`);
    assertEquals(100 + expectedWonAmount1, window.plinkoGameApi.getGameState().playerScore, "Score should update correctly for prize 1");

    // Test landing in third slot (multiplier prizeValues[2])
    window.plinkoGameApi.setPlayerScore(100); // Reset score
    let ballX_slot3 = (mockBoardWidth / numSlots) * 2.5; // Middle of third slot
    let wonAmount3 = window.plinkoGameApi.determinePrize(ballX_slot3);
    const expectedPrizeIndex = 2; // 0-indexed
    let expectedWonAmount3 = Math.round(costToPlay * prizeValues[expectedPrizeIndex]);
    assertEquals(expectedWonAmount3, wonAmount3, `Points for slot 3 (multiplier ${prizeValues[expectedPrizeIndex]}, X=${ballX_slot3.toFixed(0)}) should be ${expectedWonAmount3}`);
    assertEquals(100 + expectedWonAmount3, window.plinkoGameApi.getGameState().playerScore, "Score should update correctly for prize 3");

    // Test landing at the very edge (last slot, multiplier prizeValues[numSlots-1])
    window.plinkoGameApi.setPlayerScore(100);
    let ballX_lastSlot = mockBoardWidth - 1; // Almost at the very end, should be last slot
    let wonAmountLast = window.plinkoGameApi.determinePrize(ballX_lastSlot);
    let expectedWonAmountLast = Math.round(costToPlay * prizeValues[numSlots - 1]);
    assertEquals(expectedWonAmountLast, wonAmountLast, `Points for last slot (multiplier ${prizeValues[numSlots-1]}, X=${ballX_lastSlot}) should be ${expectedWonAmountLast}`);
    assertEquals(100 + expectedWonAmountLast, window.plinkoGameApi.getGameState().playerScore, "Score should update correctly for last prize slot");

    // Test a slot with a fractional multiplier (e.g., 0.3, which is PRIZE_VALUES[6])
    // Assuming numSlots is 13, slot index 6 is the 7th slot.
    if (numSlots === 13 && prizeValues.length === 13) {
        window.plinkoGameApi.setPlayerScore(100);
        let ballX_slot7 = (mockBoardWidth / numSlots) * 6.5; // Middle of 7th slot (index 6)
        let wonAmount7 = window.plinkoGameApi.determinePrize(ballX_slot7);
        let expectedWonAmount7 = Math.round(costToPlay * prizeValues[6]);
        assertEquals(expectedWonAmount7, wonAmount7, `Points for slot 7 (multiplier ${prizeValues[6]}, X=${ballX_slot7.toFixed(0)}) should be ${expectedWonAmount7}`);
        assertEquals(100 + expectedWonAmount7, window.plinkoGameApi.getGameState().playerScore, "Score should update correctly for slot 7 (fractional multiplier)");
    }


    // --- Test Ball Reset ---
    testResultsDiv.innerHTML += '<h4>Ball Reset Tests:</h4>';
    window.plinkoGameApi.dropBall(); // Start a drop
    assertTrue(window.plinkoGameApi.getGameState().isDropping, "isDropping should be true after dropBall starts (if score allows)");
    window.plinkoGameApi.resetBall();
    assertFalse(window.plinkoGameApi.getGameState().isDropping, "isDropping should be false after resetBall");
    // Note: Further resetBall tests might involve checking ballX, ballY if they were reliably set without full animation.

    summarizeResults();
}

// This will be called by test_runner.html's window.onload
// runPlinkoTests();
