// Mock the required DOM elements and functions
const { JSDOM } = require('jsdom');

// Set up the DOM environment before importing game.js
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div class="game-container">
        <div class="game-header">
            <div class="score-container">
                <div>Score: <span id="score">0</span></div>
            </div>
            <div class="best-container">
                <div>Best: <span id="best">0</span></div>
            </div>
            <button class="restart-game-button">Restart Game</button>
            <button class="ai-mode-button">AI Mode</button>
        </div>
        <div class="game-message">
            <p></p>
            <div class="lower">
                <a class="keep-playing-button" style="display:none;">Keep going</a>
                <a class="retry-button">Try again</a>
            </div>
        </div>
        <div class="grid-container"></div>
    </div>
    </body>
  </html>
`);

// Set up global variables
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.requestAnimationFrame = (cb) => cb(); // Mock requestAnimationFrame

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();
global.localStorage = localStorageMock;

// Import game.js after JSDOM and mocks are set up
// Functions will be available on the window object
require('../game');

// Reset mocks and DOM before each test
beforeEach(() => {
  document.body.innerHTML = dom.window.document.body.innerHTML;
  jest.clearAllMocks();
  localStorage.clear();
});

describe('2048 Game', () => {
  const { initializeGame, addNewTile, checkGameState, moveTiles } = window;

  test('should initialize the game', () => {
    initializeGame();
    const grid = document.querySelector('.grid-container');
    expect(grid.children.length).toBe(16); // 4x4 grid
    const tiles = document.querySelectorAll('.tile');
    expect(tiles.length).toBe(2);
  });

  test('should add a new tile', () => {
    initializeGame(); // Adds 2 tiles
    // Clear the grid to have a known state
    const gridContainer = document.querySelector('.grid-container');
    gridContainer.innerHTML = '';
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        gridContainer.appendChild(cell);
    }

    addNewTile();
    const tiles = document.querySelectorAll('.tile');
    expect(tiles.length).toBe(1);
  });

  test('should check game state for win', () => {
    initializeGame();
    const matrix = Array(16).fill('0');
    matrix[0] = '2048';
    const gameMessage = document.querySelector('.game-message');
    checkGameState(matrix);
    expect(gameMessage.classList.contains('game-won')).toBe(true);
  });

  test('should check game state for game over', () => {
    initializeGame();
    const matrix = [
        '2', '4', '8', '16',
        '4', '2', '16', '8',
        '8', '16', '2', '4',
        '16', '8', '4', '2'
    ];
    const gameMessage = document.querySelector('.game-message');
    checkGameState(matrix);
    expect(gameMessage.classList.contains('game-over')).toBe(true);
  });

  test('should move tiles left', async () => {
    initializeGame();

    // Mock animateMovement to resolve immediately and prevent animation logic from running
    const animateMovementMock = jest.spyOn(window, 'animateMovement').mockResolvedValue();
    const addNewTileMock = jest.spyOn(window, 'addNewTile').mockImplementation(() => {});

    // Set up a test scenario
    const gridContainer = document.querySelector('.grid-container');
    gridContainer.innerHTML = ''; // Clear grid
    const cells = [];
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        gridContainer.appendChild(cell);
        cells.push(cell);
    }
    
    // one tile at position (0,1)
    cells[1].innerHTML = '<div class="tile tile-2">2</div>';
    
    // Trigger a left move
    await moveTiles('left');
    
    // The tile should have moved to position (0,0)
    const updatedCells = Array.from(gridContainer.children);
    expect(updatedCells[0].querySelector('.tile')).not.toBeNull();
    expect(updatedCells[0].querySelector('.tile').textContent).toBe('2');
    expect(updatedCells[1].querySelector('.tile')).toBeNull();

    // Restore mocks
    animateMovementMock.mockRestore();
    addNewTileMock.mockRestore();
  });
});
