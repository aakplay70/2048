// Test file for pure game logic functions
const { 
  mergeTiles,
  performMove
} = require('../gameLogic');

// Test suite for the 2048 Game Logic
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
