// Import game logic functions
import { 
    mergeTiles,
    performMove
} from './gameLogic.js';


// Game variables

let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let gameWon = false;

// DOM elements
let gridContainer;
let scoreElement;
let bestScoreElement;
let gameMessage;
let retryButton;
let alwaysVisibleRestartButton;
let aiModeButton;

let listenersAttached = false;

// Export for testing
export { 
    initializeGame, 
    addNewTile, 
    moveTiles,
    performMove,
    mergeTiles, 
    checkGameState 
};

document.addEventListener('DOMContentLoaded', () => {
    initializeGame();
});

function initializeGame() {
    // Query DOM elements every time initializeGame is called, as DOM might be reset (especially in tests)
    gridContainer = document.querySelector('.grid-container');
    scoreElement = document.getElementById('score');
    bestScoreElement = document.getElementById('best');
    gameMessage = document.querySelector('.game-message');
    retryButton = document.querySelector('.retry-button');
    alwaysVisibleRestartButton = document.querySelector('.restart-game-button');
    aiModeButton = document.querySelector('.ai-mode-button');

    // Attach event listeners only once
    if (!listenersAttached) {
        window.addEventListener('keydown', handleKeyPress);
        retryButton.addEventListener('click', initializeGame);
        alwaysVisibleRestartButton.addEventListener('click', initializeGame);
        aiModeButton.addEventListener('click', toggleAiMode);
        listenersAttached = true;
    }

    score = 0;
    scoreElement.textContent = score;
    bestScoreElement.textContent = bestScore;
    gameWon = false;
    
    // Clear existing tiles
    gridContainer.innerHTML = '';
    
    // Create empty grid
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            gridContainer.appendChild(cell);
        }
    }
    
    addNewTile();
    addNewTile();
    gameMessage.style.display = 'none';
}

function addNewTile() {
    const cells = document.querySelectorAll('.grid-cell');
    const emptyCells = Array.from(cells).filter(cell => !cell.querySelector('.tile'));
    
    if (emptyCells.length === 0) return;
    
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    
    const tile = document.createElement('div');
    tile.className = `tile tile-${value}`;
    tile.textContent = value;
    
    randomCell.appendChild(tile);
    
    // Animate the new tile
    tile.style.transform = 'scale(0)';
    setTimeout(() => {
        tile.style.transform = 'scale(1)';
    }, 0);
}

function handleKeyPress(e) {
    const direction = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right'
    }[e.key];
    
    if (direction) {
        moveTiles(direction);
    }
}

function moveTiles(direction) {
    const cells = Array.from(document.querySelectorAll('.grid-cell'));
    const matrix = cells.map(cell => cell.querySelector('.tile')?.textContent || '0');
    const { newMatrix, scoreChange } = performMove(matrix, direction);
    
    if (matrix.join('') === newMatrix.join('')) return;
    
    // Update the grid
    cells.forEach((cell, i) => {
        const tile = cell.querySelector('.tile');
        const value = newMatrix[i];
        
        if (value === '0') {
            if (tile) cell.removeChild(tile);
        } else {
            if (!tile) {
                const newTile = document.createElement('div');
                newTile.className = `tile tile-${value}`;
                newTile.textContent = value;
                cell.appendChild(newTile);
            } else {
                tile.textContent = value;
                tile.className = `tile tile-${value}`;
            }
        }
    });
    
    // Add new tile
    addNewTile();
    
    // Update score
    score += scoreChange;
    scoreElement.textContent = score;
    
    // Update best score
    if (score > bestScore) {
        bestScore = score;
        bestScoreElement.textContent = bestScore;
        localStorage.setItem('bestScore', bestScore);
    }
    
    // Check for win condition
    if (newMatrix.some(tile => tile === '2048') && !gameWon) {
        gameWon = true;
        gameMessage.querySelector('p').textContent = 'You Won!';
        gameMessage.style.display = 'flex';
    }
    
    // Check game over condition
    checkGameState();
}

function checkGameState() {
    const cells = Array.from(document.querySelectorAll('.grid-cell'));
    const matrix = cells.map(cell => cell.querySelector('.tile')?.textContent || '0');
    
    // Check if there are any empty cells
    if (matrix.includes('0')) return;
    
    // Check if any adjacent tiles can be merged
    for (let i = 0; i < 16; i++) {
        const value = matrix[i];
        if (value === '0') continue;
        
        // Check right
        if (i % 4 !== 3 && value === matrix[i + 1]) return;
        // Check down
        if (i < 12 && value === matrix[i + 4]) return;
    }
    
    // Game over
    gameMessage.querySelector('p').textContent = 'Game Over!';
    gameMessage.style.display = 'flex';
}

function getBoardMatrix() {
    const cells = Array.from(document.querySelectorAll('.grid-cell'));
    return cells.map(cell => cell.querySelector('.tile')?.textContent || '0');
}

function simulateMove(matrix, direction) {
    return performMove(matrix, direction);
}

function evaluateBoard(matrix) {
    let score = 0;
    const size = 4; // 4x4 grid

    // 1. Empty Cells: More empty cells means more flexibility
    const emptyCells = matrix.filter(tile => tile === '0').length;
    score += emptyCells * 100; // Give a high weight to empty cells

    // Convert matrix to 2D for easier processing
    const board2D = [];
    for (let i = 0; i < size; i++) {
        board2D.push(matrix.slice(i * size, (i + 1) * size));
    }

    // 2. Largest Tile Position: Prioritize top-left corner
    const maxTileValue = Math.max(...matrix.map(Number));
    const topLeftTile = Number(board2D[0][0]);
    if (topLeftTile === maxTileValue) {
        score += 2000; // Significant bonus for largest tile in top-left
    } else {
        // Penalize if largest tile is not in a corner, or is in a bad position
        // This is a simplified approach, could be more nuanced
        const maxTileIndex = matrix.indexOf(String(maxTileValue));
        if (maxTileIndex !== 0 && maxTileIndex !== 3 && maxTileIndex !== 12 && maxTileIndex !== 15) {
             score -= 500; // Penalize if largest tile is not in any corner
        }
    }


    // 3. Monotonicity: Encourage tiles to be in increasing/decreasing order along rows/columns
    // This is a simplified version. A more robust one would check for strict monotonicity.
    let monotonicityScore = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size - 1; c++) {
            const current = Number(board2D[r][c]);
            const next = Number(board2D[r][c + 1]);
            if (current > 0 && next > 0) {
                if (current >= next) monotonicityScore += 10; // Increasing or equal
                else monotonicityScore -= 20; // Decreasing is bad
            }
        }
    }
    for (let c = 0; c < size; c++) {
        for (let r = 0; r < size - 1; r++) {
            const current = Number(board2D[r][c]);
            const next = Number(board2D[r + 1][c]);
            if (current > 0 && next > 0) {
                if (current >= next) monotonicityScore += 10; // Increasing or equal
                else monotonicityScore -= 20; // Decreasing is bad
            }
            }
        }
    score += monotonicityScore;


    // 4. Potential Merges: Count adjacent equal tiles
    let mergeOpportunities = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const current = Number(board2D[r][c]);
            if (current === 0) continue;

            // Check right
            if (c < size - 1 && Number(board2D[r][c + 1]) === current) {
                mergeOpportunities += current; // Add value for merge opportunity
            }
            // Check down
            if (r < size - 1 && Number(board2D[r + 1][c]) === current) {
                mergeOpportunities += current; // Add value for merge opportunity
            }
        }
    }
    score += mergeOpportunities * 5; // Weight merge opportunities

    // 5. Smoothness: Sum of absolute differences between adjacent tiles (lower is better)
    let smoothness = 0;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const current = Number(board2D[r][c]);
            if (current === 0) continue;

            // Check right
            if (c < size - 1 && Number(board2D[r][c + 1]) !== 0) {
                smoothness += Math.abs(current - Number(board2D[r][c + 1]));
            }
            // Check down
            if (r < size - 1 && Number(board2D[r + 1][c]) !== 0) {
                smoothness += Math.abs(current - Number(board2D[r + 1][c]));
            }
        }
    }
    score -= smoothness * 2; // Penalize for high smoothness (large differences)

    return score;
}


let aiPlaying = false;
let aiInterval;

function toggleAiMode() {
    if (aiPlaying) {
        clearInterval(aiInterval);
        aiPlaying = false;
        aiModeButton.textContent = 'AI Mode';
    } else {
        aiPlaying = true;
        aiModeButton.textContent = 'Stop AI';
        aiInterval = setInterval(aiPlay, 500); // 0.5 second delay
    }
}

function findBestMove(matrix) {
    const moves = ['up', 'down', 'left', 'right'];
    let bestMove = '';
    let bestScore = -Infinity;
    const searchDepth = 3; // Look 3 moves ahead

    for (const move of moves) {
        const { newMatrix: simulatedMatrix } = simulateMove(matrix, move);
        if (JSON.stringify(simulatedMatrix) === JSON.stringify(matrix)) {
            continue; // Skip moves that don't change the board
        }

        // The score for a move is the expected score of the board state *after* the move
        // and after a random tile has been placed.
        const score = expectimax(simulatedMatrix, searchDepth, false); // Start with computer's turn (chance node)
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    return bestMove;
}

function expectimax(matrix, depth, isPlayerTurn) {
    if (depth === 0 || (!matrix.includes('0') && !canMerge(matrix))) {
        return evaluateBoard(matrix);
    }

    if (isPlayerTurn) { // Max node (Player's turn)
        let maxScore = -Infinity;
        const moves = ['up', 'down', 'left', 'right'];
        for (const move of moves) {
            const { newMatrix: nextMatrix } = simulateMove(matrix, move);
            if (JSON.stringify(nextMatrix) !== JSON.stringify(matrix)) {
                maxScore = Math.max(maxScore, expectimax(nextMatrix, depth - 1, false));
            }
        }
        return maxScore === -Infinity ? evaluateBoard(matrix) : maxScore;
    } else { // Chance node (Computer's turn)
        const emptyCells = [];
        for (let i = 0; i < matrix.length; i++) {
            if (matrix[i] === '0') {
                emptyCells.push(i);
            }
        }

        if (emptyCells.length === 0) {
            return evaluateBoard(matrix);
        }

        let totalScore = 0;
        for (const cellIndex of emptyCells) {
            // Possibility 1: a '2' appears (90% chance)
            const matrixWith2 = [...matrix];
            matrixWith2[cellIndex] = '2';
            totalScore += 0.9 * expectimax(matrixWith2, depth - 1, true);

            // Possibility 2: a '4' appears (10% chance)
            const matrixWith4 = [...matrix];
            matrixWith4[cellIndex] = '4';
            totalScore += 0.1 * expectimax(matrixWith4, depth - 1, true);
        }
        return totalScore / emptyCells.length; // Average score over all possible tile placements
    }
}

function aiPlay() {
    const currentMatrix = getBoardMatrix();
    const bestMove = findBestMove(currentMatrix);

    if (bestMove) {
        moveTiles(bestMove);
    } else {
        // If no move found, stop AI
        clearInterval(aiInterval);
        aiPlaying = false;
        aiModeButton.textContent = 'AI Mode';
        console.log("AI stopped: No valid moves found.");
    }

    // Check for game over after move
    const matrixAfterMove = getBoardMatrix();
    if (!matrixAfterMove.includes('0') && !canMerge(matrixAfterMove)) {
        clearInterval(aiInterval);
        aiPlaying = false;
        aiModeButton.textContent = 'AI Mode';
        console.log("AI stopped: Game Over.");
    }
}

function canMerge(matrix) {
    for (let i = 0; i < 16; i++) {
        const value = matrix[i];
        if (value === '0') continue;

        // Check right
        if (i % 4 !== 3 && value === matrix[i + 1]) return true;
        // Check down
        if (i < 12 && value === matrix[i + 4]) return true;
    }
    return false;
}
