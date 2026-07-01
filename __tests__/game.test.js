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
  const { initializeGame, addNewTile, checkGameState, moveTiles, toggleAiMode } = window;

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

  test('moveTiles does not update the board until awaited', async () => {
    initializeGame();
    const addNewTileMock = jest.spyOn(window, 'addNewTile').mockImplementation(() => {});
    const gridContainer = document.querySelector('.grid-container');
    gridContainer.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      gridContainer.appendChild(cell);
    }
    gridContainer.children[1].innerHTML = '<div class="tile tile-2">2</div>';

    const movePromise = moveTiles('left');

    // Right after firing the move (before awaiting it), the DOM must still
    // reflect the pre-move state. A caller that reads the board synchronously
    // right after calling moveTiles (instead of awaiting it) would be
    // inspecting stale data.
    let boardMatrix = window.getBoardMatrix();
    expect(boardMatrix[1]).toBe('2');
    expect(boardMatrix[0]).toBe('0');

    await movePromise;

    boardMatrix = window.getBoardMatrix();
    expect(boardMatrix[0]).toBe('2');
    expect(boardMatrix[1]).toBe('0');

    addNewTileMock.mockRestore();
  });

  test('restarting mid-move does not corrupt the freshly initialized board', async () => {
    initializeGame();
    const gridContainer = document.querySelector('.grid-container');
    gridContainer.innerHTML = '';
    for (let i = 0; i < 16; i++) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      gridContainer.appendChild(cell);
    }
    gridContainer.children[1].innerHTML = '<div class="tile tile-2">2</div>';

    // Kick off a move but don't await it yet, leaving it "animating".
    const movePromise = moveTiles('left');

    // Restart while that move is still in flight (e.g. the user clicks
    // Restart mid-animation).
    initializeGame();
    const freshTileCount = document.querySelectorAll('.tile').length;
    const freshScore = document.getElementById('score').textContent;

    // Let the stale move settle; it must not overwrite the fresh game.
    await movePromise;

    expect(document.querySelectorAll('.tile').length).toBe(freshTileCount);
    expect(document.getElementById('score').textContent).toBe(freshScore);

    // Input must not be stuck locked from the discarded move.
    await expect(moveTiles('down')).resolves.not.toThrow();
  });

  test('restarting after a win resumes AI mode instead of leaving it stuck', () => {
    const setIntervalSpy = jest.spyOn(global, 'setInterval');
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    initializeGame();
    toggleAiMode();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);

    // Simulate a win while AI mode is on: this should pause the interval but
    // must not turn AI mode off (so "Keep going" / restart can resume it).
    const winMatrix = Array(16).fill('0');
    winMatrix[0] = '2048';
    checkGameState(winMatrix);
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.ai-mode-button').textContent).toBe('Stop AI');

    // Restarting (instead of "Keep going") must re-sync the AI interval with
    // the still-true AI flag, instead of leaving the button reading "Stop AI"
    // while nothing is actually running.
    initializeGame();
    expect(setIntervalSpy).toHaveBeenCalledTimes(2);
    expect(document.querySelector('.ai-mode-button').textContent).toBe('Stop AI');

    setIntervalSpy.mockRestore();
    clearIntervalSpy.mockRestore();
    toggleAiMode(); // Leave AI mode off for subsequent tests (module-level state).
  });

  test('game over while AI mode is on stops AI mode', () => {
    initializeGame();
    toggleAiMode();
    expect(document.querySelector('.ai-mode-button').textContent).toBe('Stop AI');

    const gameOverMatrix = [
      '2', '4', '8', '16',
      '4', '2', '16', '8',
      '8', '16', '2', '4',
      '16', '8', '4', '2'
    ];
    checkGameState(gameOverMatrix);

    expect(document.querySelector('.ai-mode-button').textContent).toBe('AI Mode');
  });
});
