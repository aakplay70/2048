// Mock the required DOM elements and functions
const { JSDOM } = require('jsdom');
const { mergeTiles, performMove } = require('../gameLogic');

// Import game.js after JSDOM setup
const { initializeGame, addNewTile, checkGameState } = require('../game');

// Set up the DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <div class="grid-container"></div>
      <div id="score">0</div>
      <div id="best">0</div>
      <div class="game-message">
        <p></p>
        <div class="lower">
          <a class="retry-button">Try again</a>
        </div>
      </div>
    </body>
  </html>
`);

// Set up global variables
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

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

// Helper function to create a 4x4 grid from an array of values
const createGrid = (values) => {
  const grid = [];
  for (let i = 0; i < 16; i++) {
    grid[i] = values[i] || '0';
  }
  return grid;
};

// Reset mocks and DOM before each test
beforeEach(() => {
  // Reset the DOM
  document.body.innerHTML = `
    <div class="grid-container"></div>
    <div id="score">0</div>
    <div id="best">0</div>
    <div class="game-message">
      <p></p>
      <div class="lower">
        <a class="retry-button">Try again</a>
      </div>
    </div>
  `;
  
  // Reset mocks
  jest.clearAllMocks();
  localStorage.clear();
});

describe('2048 Game Logic', () => {
  describe('mergeTiles', () => {
    test('should combine matching adjacent tiles', () => {
      const tiles = ['2', '2', '0', '0'];
      const { merged } = mergeTiles(tiles);
      expect(merged).toEqual(['4', '0', '0', '0']);
    });

    test('should only combine once per move', () => {
      const tiles = ['2', '2', '2', '2'];
      const { merged } = mergeTiles(tiles);
      expect(merged).toEqual(['4', '4', '0', '0']);
    });

    test('should not combine different numbers', () => {
      const tiles = ['2', '4', '2', '4'];
      const { merged } = mergeTiles(tiles);
      expect(merged).toEqual(['2', '4', '2', '4']);
    });

    test('should handle empty tiles', () => {
      const tiles = ['0', '0', '2', '2'];
      const { merged } = mergeTiles(tiles);
      expect(merged).toEqual(['4', '0', '0', '0']);
    });
  });



  describe('performMove', () => {
    test('should move tiles left', () => {
      const matrix = [
        '2', '0', '0', '0',
        '0', '2', '0', '0',
        '0', '0', '2', '0',
        '0', '0', '0', '2'
      ];
      
      const { newMatrix: moved } = performMove([...matrix], 'left');
      
      // First column should have values moved to the left
      expect(moved[0]).toBe('2');
      expect(moved[4]).toBe('2');
      expect(moved[8]).toBe('2');
      expect(moved[12]).toBe('2');
    });

    test('should move tiles right', () => {
      const matrix = [
        '2', '0', '0', '0',
        '0', '2', '0', '0',
        '0', '0', '2', '0',
        '0', '0', '0', '2'
      ];
      
      const { newMatrix: moved } = performMove([...matrix], 'right');
      
      // Last column should have values moved to the right
      expect(moved[3]).toBe('2');
      expect(moved[7]).toBe('2');
      expect(moved[11]).toBe('2');
      expect(moved[15]).toBe('2');
    });

    test('should merge tiles when moving', () => {
      const matrix = [
        '2', '2', '0', '0',
        '4', '4', '0', '0',
        '8', '0', '8', '0',
        '0', '0', '0', '0'
      ];
      
      const { newMatrix: moved } = performMove([...matrix], 'left');
      
      // First column should have merged values
      expect(moved[0]).toBe('4');
      expect(moved[4]).toBe('8');
      expect(moved[8]).toBe('16');
    });
  });
});

describe('2048 Game', () => {
  test('should initialize the game', () => {
    initializeGame();
    const grid = document.querySelector('.grid-container');
    expect(grid.children.length).toBe(16); // 4x4 grid
  });

  test('should add a new tile', () => {
    // First initialize the game to set up the grid
    initializeGame();
    // initializeGame already adds two tiles, so we expect 2 tiles
    const tiles = document.querySelectorAll('.tile');
    expect(tiles.length).toBe(2);
  });

  test('should check game state', () => {
    // This is a simple test to ensure the function runs without errors
    initializeGame();
    expect(() => checkGameState()).not.toThrow();
  });

  test('should move tiles left', () => {
    initializeGame();
    // Set up a test scenario
    const grid = document.querySelector('.grid-container');
    const cells = Array.from(grid.children);
    
    // Set up a simple scenario: one tile at position (0,1)
    cells[1].innerHTML = '<div class="tile">2</div>';
    
    // Trigger a left move
    const event = new window.KeyboardEvent('keydown', { key: 'ArrowLeft' });
    window.dispatchEvent(event);
    
    // The tile should have moved to position (0,0)
    expect(cells[0].querySelector('.tile')).not.toBeNull();
    expect(cells[1].querySelector('.tile')).toBeNull();
  });
});
