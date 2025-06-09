const grid = document.querySelector('.grid-container');
const scoreElement = document.getElementById('score');
const bestScoreElement = document.getElementById('best');
const gameMessage = document.querySelector('.game-message');
const restartButton = document.querySelector('.restart-button');

let score = 0;
let bestScore = localStorage.getItem('bestScore') || 0;
let gameWon = false;

// Initialize game
initializeGame();

// Event Listeners
window.addEventListener('keydown', handleKeyPress);
restartButton.addEventListener('click', initializeGame);

function initializeGame() {
    score = 0;
    scoreElement.textContent = score;
    bestScoreElement.textContent = bestScore;
    gameWon = false;
    
    // Clear existing tiles
    grid.innerHTML = '';
    
    // Create empty grid
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            grid.appendChild(cell);
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
    const newMatrix = performMove(matrix, direction);
    
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
            }
        }
    });
    
    // Add new tile
    addNewTile();
    
    // Update score
    score += calculateScoreChange(matrix, newMatrix);
    scoreElement.textContent = score;
    
    // Update best score
    if (score > bestScore) {
        bestScore = score;
        bestScoreElement.textContent = bestScore;
        localStorage.setItem('bestScore', bestScore);
    }
    
    // Check game state
    checkGameState();
}

function performMove(matrix, direction) {
    const size = 4;
    const newMatrix = [...matrix];
    
    switch (direction) {
        case 'up':
            for (let col = 0; col < size; col++) {
                const column = [];
                for (let row = 0; row < size; row++) {
                    column.push(matrix[row * size + col]);
                }
                const merged = mergeTiles(column);
                for (let row = 0; row < size; row++) {
                    newMatrix[row * size + col] = merged[row];
                }
            }
            break;
            
        case 'down':
            for (let col = 0; col < size; col++) {
                const column = [];
                for (let row = 0; row < size; row++) {
                    column.push(matrix[(size - 1 - row) * size + col]);
                }
                const merged = mergeTiles(column);
                for (let row = 0; row < size; row++) {
                    newMatrix[(size - 1 - row) * size + col] = merged[row];
                }
            }
            break;
            
        case 'left':
            for (let row = 0; row < size; row++) {
                const merged = mergeTiles(matrix.slice(row * size, (row + 1) * size));
                for (let col = 0; col < size; col++) {
                    newMatrix[row * size + col] = merged[col];
                }
            }
            break;
            
        case 'right':
            for (let row = 0; row < size; row++) {
                const merged = mergeTiles(matrix.slice(row * size, (row + 1) * size).reverse());
                for (let col = 0; col < size; col++) {
                    newMatrix[row * size + (size - 1 - col)] = merged[col];
                }
            }
            break;
    }
    
    return newMatrix;
}

function mergeTiles(tiles) {
    const result = [];
    let skip = false;
    
    tiles.forEach((tile, i) => {
        if (skip) {
            skip = false;
            return;
        }
        
        if (tile === '0') return;
        
        if (i < tiles.length - 1 && tile === tiles[i + 1]) {
            result.push((parseInt(tile) * 2).toString());
            skip = true;
            if (parseInt(tile) * 2 === 2048 && !gameWon) {
                gameWon = true;
                gameMessage.querySelector('p').textContent = 'You Won!';
                gameMessage.style.display = 'flex';
            }
        } else {
            result.push(tile);
        }
    });
    
    while (result.length < tiles.length) {
        result.push('0');
    }
    
    return result;
}

function calculateScoreChange(oldMatrix, newMatrix) {
    let scoreChange = 0;
    
    for (let i = 0; i < oldMatrix.length; i++) {
        if (oldMatrix[i] !== newMatrix[i] && newMatrix[i] !== '0') {
            const oldValue = parseInt(oldMatrix[i]) || 0;
            const newValue = parseInt(newMatrix[i]);
            if (newValue > oldValue) {
                scoreChange += newValue;
            }
        }
    }
    
    return scoreChange;
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
