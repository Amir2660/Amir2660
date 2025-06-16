// JavaScript for Plinko game logic

// Expose a namespace for testing or direct interaction if needed
window.plinkoGameApi = {};

// --- Constants and Variables ---
const PEG_ROWS = 10;
const PEGS_PER_ROW_START = 7;
const PEG_SIZE = 10; // px
const PEG_SPACING_HORIZONTAL = 60; // px
const PEG_SPACING_VERTICAL = 35; // px
const BALL_SIZE = 20; // px
const BALL_START_OFFSET_Y = - (PEG_SPACING_VERTICAL / 2);

const GRAVITY = 0.15;
const HORIZONTAL_FRICTION = 0.99;
const PEG_BOUNCE_HORIZONTAL_SPEED = 3;
const PEG_BOUNCE_VERTICAL_DAMPING = 0.7;
const MIN_PRIZE_FOR_WIN_SOUND = 25;
const COST_TO_PLAY = 10;

// HTML Element References - will be initialized in initGame
let boardElement, ballElement, dropButton, scoreDisplay, messageDisplay;

// Game State
let playerScore = 100; // Default, can be reset
let pegs = [];
let ballX, ballY;
let ballVX, ballVY;
let isDropping = false;
let animationFrameId = null;

// Prize values - made accessible for testing determinePrize
const PRIZE_VALUES = [10, 25, 5, 50, 10, 25, 5]; // Ensure enough values if slots change


// --- Sound Effect Placeholders ---
function playSound_ballDrop() { console.log("DEBUG: Play ball drop sound"); }
function playSound_pegHit() { console.log("DEBUG: Play peg hit sound"); }
function playSound_winPrize() { console.log("DEBUG: Play win prize sound"); }
function playSound_losePrize() { console.log("DEBUG: Play lose prize / neutral sound"); }

// --- Core Logic Functions (Internal - can be called by game or tests) ---

function initializeDomReferences() {
    boardElement = document.getElementById('plinko-board');
    ballElement = document.getElementById('ball');
    dropButton = document.getElementById('drop-ball-button');
    scoreDisplay = document.getElementById('score-display');
    messageDisplay = document.getElementById('message-display');
}

function createPegsInternal() {
    if (!boardElement) {
        console.error("Board element not initialized for peg creation.");
        return;
    }
    boardElement.innerHTML = '';
    pegs = [];
    const boardWidth = boardElement.clientWidth;

    for (let row = 0; row < PEG_ROWS; row++) {
        const pegsInThisRow = PEGS_PER_ROW_START + (row % 2 === 0 ? 0 : 1);
        const totalRowWidth = (pegsInThisRow - 1) * PEG_SPACING_HORIZONTAL;
        let startX = (boardWidth - totalRowWidth) / 2;

        if (row % 2 !== 0) {
            startX -= PEG_SPACING_HORIZONTAL / 2;
        }
        startX = Math.max(startX, PEG_SPACING_HORIZONTAL / 2);

        for (let col = 0; col < pegsInThisRow; col++) {
            const pegElement = document.createElement('div');
            pegElement.classList.add('peg');
            pegElement.style.width = `${PEG_SIZE}px`;
            pegElement.style.height = `${PEG_SIZE}px`;
            pegElement.style.backgroundColor = 'grey';
            pegElement.style.borderRadius = '50%';
            pegElement.style.position = 'absolute';

            const pegCenterX = startX + col * PEG_SPACING_HORIZONTAL;
            const pegCenterY = (row + 1) * PEG_SPACING_VERTICAL;

            if (pegCenterX - PEG_SIZE / 2 >= 0 && pegCenterX + PEG_SIZE / 2 <= boardWidth) {
                pegElement.style.left = `${pegCenterX - PEG_SIZE / 2}px`;
                pegElement.style.top = `${pegCenterY - PEG_SIZE / 2}px`;
                boardElement.appendChild(pegElement);
                pegs.push({
                    element: pegElement,
                    x: pegCenterX,
                    y: pegCenterY,
                    radius: PEG_SIZE / 2
                });
            }
        }
    }
    return pegs.length; // Return peg count for testing
}

function resetBallInternal(wasDropped = false) {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    isDropping = false;

    if (!boardElement || !ballElement || !messageDisplay || !dropButton) {
        console.warn("DOM elements not fully available for resetBallInternal. Skipping some operations.");
        // In a pure test environment without DOM, some of this might not run.
    }

    const boardWidth = boardElement ? boardElement.clientWidth : 500; // Default for testing
    ballX = boardWidth / 2;
    ballY = BALL_START_OFFSET_Y;

    if (ballElement) {
        ballElement.style.left = `${ballX - BALL_SIZE / 2}px`;
        ballElement.style.top = `${ballY - BALL_SIZE / 2}px`;
    }

    if (messageDisplay && !wasDropped) {
        messageDisplay.textContent = "Ready to drop!";
        messageDisplay.style.color = "green";
    }
    if (dropButton) dropButton.disabled = false;
}

function dropBallInternal() {
    if (isDropping) return false;

    if (playerScore < COST_TO_PLAY) {
        if (messageDisplay) {
            messageDisplay.textContent = `Not enough points! Need ${COST_TO_PLAY}.`;
            messageDisplay.style.color = "red";
        }
        return false; // Indicate drop failed
    }

    if (messageDisplay) {
        messageDisplay.textContent = "Ball dropped!";
        messageDisplay.style.color = "green";
    }

    playerScore -= COST_TO_PLAY;
    if(scoreDisplay) updateScoreDisplayInternal(); // Update display if available

    playSound_ballDrop();

    isDropping = true;
    if (dropButton) dropButton.disabled = true;

    const boardWidth = boardElement ? boardElement.clientWidth : 500;
    ballX = boardWidth / 2 + (Math.random() - 0.5) * PEG_SPACING_HORIZONTAL / 3;
    ballY = BALL_START_OFFSET_Y;
    ballVY = 0.5;
    ballVX = (Math.random() - 0.5) * 2;

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    // In a non-browser test environment, requestAnimationFrame won't run.
    // For testing game logic, we might need to call updateGameInternal manually or mock raf.
    if (typeof window !== 'undefined' && window.requestAnimationFrame) {
        updateGameInternal();
    }
    return true; // Indicate drop succeeded
}

function updateGameInternal() {
    if (!isDropping) return;

    ballVY += GRAVITY;
    ballY += ballVY;
    ballVX *= HORIZONTAL_FRICTION;
    ballX += ballVX;

    const boardWidth = boardElement ? boardElement.clientWidth : 500;
    const ballRadius = BALL_SIZE / 2;

    if (ballX - ballRadius < 0) {
        ballX = ballRadius;
        ballVX *= -1;
    } else if (ballX + ballRadius > boardWidth) {
        ballX = boardWidth - ballRadius;
        ballVX *= -1;
    }

    for (const peg of pegs) {
        const dx = ballX - peg.x;
        const dy = ballY - peg.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const combinedRadii = ballRadius + peg.radius;

        if (distance < combinedRadii) {
            playSound_pegHit();
            const normDX = dx / distance;
            const normDY = dy / distance;
            const overlap = combinedRadii - distance;
            ballX += normDX * overlap * 0.6;
            ballY += normDY * overlap * 0.6;
            ballVY *= -PEG_BOUNCE_VERTICAL_DAMPING;
            ballVX = normDX * PEG_BOUNCE_HORIZONTAL_SPEED + (Math.random() -0.5) * 0.5;
            if (Math.abs(ballVY) < 0.5 && dy < 0) ballVY = -1.5;
            break;
        }
    }

    if (ballElement) {
        ballElement.style.left = `${ballX - ballRadius}px`;
        ballElement.style.top = `${ballY - ballRadius}px`;
    }

    const boardHeight = boardElement ? boardElement.clientHeight : 400;
    if (ballY + ballRadius > boardHeight) {
        isDropping = false;
        determinePrizeInternal(ballX); // Pass current ballX
        resetBallInternal(true);
        return;
    }

    animationFrameId = requestAnimationFrame(updateGameInternal);
}

function determinePrizeInternal(finalBallX) {
    // Use the passed finalBallX for prize determination
    const currentBoardWidth = boardElement ? boardElement.clientWidth : 500; // Use actual or default
    const prizeSlotsCount = boardElement ? document.querySelectorAll('#prize-slots .prize-slot').length : 5;
    const slotWidth = currentBoardWidth / prizeSlotsCount;
    const slotIndex = Math.min(Math.floor(finalBallX / slotWidth), prizeSlotsCount - 1);

    const wonAmount = PRIZE_VALUES[slotIndex % PRIZE_VALUES.length];

    playerScore += wonAmount;
    if(scoreDisplay) updateScoreDisplayInternal();

    if (messageDisplay) {
        if (wonAmount > 0) {
            messageDisplay.textContent = `Congratulations! You won ${wonAmount} points!`;
            messageDisplay.style.color = "blue";
            playSound_winPrize();
        } else {
            messageDisplay.textContent = "No prize this time. Better luck next drop!";
            messageDisplay.style.color = "orange";
            playSound_losePrize();
        }
    }
    // console.log(`Ball landed at X: ${finalBallX.toFixed(2)}, slot: ${slotIndex + 1}, won: ${wonAmount}`);
    return wonAmount; // Return for testing
}

function updateScoreDisplayInternal() {
    if (scoreDisplay) {
        scoreDisplay.textContent = `Score: ${playerScore}`;
    }
}

function initGame() {
    initializeDomReferences(); // Get actual DOM elements
    if (!boardElement) { // If critical elements are missing, don't proceed
        console.error("Plinko board HTML elements not found. Game cannot initialize.");
        if(messageDisplay) messageDisplay.textContent = "Error: Game elements missing!";
        return;
    }
    createPegsInternal();
    resetBallInternal();
    updateScoreDisplayInternal();
    if (dropButton) dropButton.addEventListener('click', dropBallInternal);

    // Resize listener for actual game play
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', () => {
            if (isDropping) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
                isDropping = false;
            }
            createPegsInternal(); // Recreate pegs with new dimensions
            resetBallInternal(); // Reset ball position
        });
    }
}

// --- Expose functions and variables for testing ---
window.plinkoGameApi.getGameState = () => ({ // Provide a way to get current state
    playerScore,
    COST_TO_PLAY,
    PEG_ROWS,
    PEGS_PER_ROW_START,
    PRIZE_VALUES,
    pegs, // Direct access to the pegs array
    isDropping,
    ballX, ballY, ballVX, ballVY // For more advanced tests if needed
});
window.plinkoGameApi.setPlayerScore = (newScore) => { playerScore = newScore; }; // Allow setting score for tests
window.plinkoGameApi.createPegs = createPegsInternal;
window.plinkoGameApi.dropBall = dropBallInternal;
window.plinkoGameApi.determinePrize = determinePrizeInternal; // Expose with ballX param
window.plinkoGameApi.resetBall = resetBallInternal;
window.plinkoGameApi.initGameForTest = () => { // Special init for tests that might not need full DOM
    initializeDomReferences(); // Try to get real elements
    // If boardElement is available, use its dimensions, otherwise use defaults
    const testBoardWidth = boardElement ? boardElement.clientWidth : 500;
    const testBoardHeight = boardElement ? boardElement.clientHeight : 400;

    // Mock elements if not present for headless tests
    if (!boardElement) {
        boardElement = { clientWidth: testBoardWidth, clientHeight: testBoardHeight, innerHTML: '', appendChild: () => {} };
    }
    if (!ballElement) ballElement = { style: {} };
    if (!scoreDisplay) scoreDisplay = { textContent: '' };
    if (!messageDisplay) messageDisplay = { textContent: '', style: {} };
    if (!dropButton) dropButton = { disabled: false, addEventListener: () => {} };

    // createPegsInternal(); // Create pegs using potentially mocked boardElement
    // resetBallInternal();
    // updateScoreDisplayInternal();
};


// --- Game Initialization (only if not in a test-like environment or specifically called) ---
if (typeof window !== 'undefined' && !window.isRunningTests) { // Avoid auto-running if in test runner
    document.addEventListener('DOMContentLoaded', initGame);
}
