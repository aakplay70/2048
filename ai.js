// AI logic for 2048 game

import { performMove } from './gameLogic.js';

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

export { findBestMove, evaluateBoard, expectimax, simulateMove, canMerge };
