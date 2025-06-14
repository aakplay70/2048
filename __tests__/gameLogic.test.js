// Test file for pure game logic functions
const { 
  mergeTiles,
  performMove
} = require('../gameLogic');

// Test suite for the 2048 Game Logic
describe('2048 Game Logic', () => {
    describe('mergeTiles', () => {
        test('should combine matching adjacent tiles and return correct actions', () => {
            const tiles = ['2', '2', '0', '0'];
            const { merged, score, actions } = mergeTiles(tiles);
            expect(merged).toEqual(['4', '0', '0', '0']);
            expect(score).toBe(4);
            expect(actions).toEqual([
                { from: 0, to: 0, value: '2', isMerge: true },
                { from: 1, to: 0, value: '2', isMerge: true }
            ]);
        });

        test('should only combine once per move and return correct actions', () => {
            const tiles = ['2', '2', '2', '2'];
            const { merged, score, actions } = mergeTiles(tiles);
            expect(merged).toEqual(['4', '4', '0', '0']);
            expect(score).toBe(8);
            expect(actions).toEqual([
                { from: 0, to: 0, value: '2', isMerge: true },
                { from: 1, to: 0, value: '2', isMerge: true },
                { from: 2, to: 1, value: '2', isMerge: true },
                { from: 3, to: 1, value: '2', isMerge: true }
            ]);
        });

        test('should not combine different numbers', () => {
            const tiles = ['2', '4', '2', '4'];
            const { merged, score, actions } = mergeTiles(tiles);
            expect(merged).toEqual(['2', '4', '2', '4']);
            expect(score).toBe(0);
            expect(actions).toEqual([
                { from: 0, to: 0, value: '2', isMerge: false },
                { from: 1, to: 1, value: '4', isMerge: false },
                { from: 2, to: 2, value: '2', isMerge: false },
                { from: 3, to: 3, value: '4', isMerge: false }
            ]);
        });

        test('should handle empty tiles and return correct actions', () => {
            const tiles = ['0', '0', '2', '2'];
            const { merged, score, actions } = mergeTiles(tiles);
            expect(merged).toEqual(['4', '0', '0', '0']);
            expect(score).toBe(4);
            expect(actions).toEqual([
                { from: 2, to: 0, value: '2', isMerge: true },
                { from: 3, to: 0, value: '2', isMerge: true }
            ]);
        });

        test('should handle a line with a single merge at the end', () => {
            const tiles = ['2', '4', '2', '2'];
            const { merged, score, actions } = mergeTiles(tiles);
            expect(merged).toEqual(['2', '4', '4', '0']);
            expect(score).toBe(4);
            expect(actions).toEqual([
                { from: 0, to: 0, value: '2', isMerge: false },
                { from: 1, to: 1, value: '4', isMerge: false },
                { from: 2, to: 2, value: '2', isMerge: true },
                { from: 3, to: 2, value: '2', isMerge: true }
            ]);
        });
    });



    describe('performMove', () => {
        test('should move tiles left and set hasChanged flag', () => {
            const matrix = [
                '2', '0', '0', '0',
                '0', '2', '0', '0',
                '0', '0', '2', '0',
                '0', '0', '0', '2'
            ];

            const { newMatrix, hasChanged } = performMove([...matrix], 'left');

            const expectedMatrix = [
                '2', '0', '0', '0',
                '2', '0', '0', '0',
                '2', '0', '0', '0',
                '2', '0', '0', '0'
            ];

            expect(newMatrix).toEqual(expectedMatrix);
            expect(hasChanged).toBe(true);
        });

        test('should move tiles right and return correct actions', () => {
            const matrix = [
                '2', '0', '0', '0',
                '0', '2', '0', '0',
                '0', '0', '2', '0',
                '0', '0', '0', '2'
            ];

            const { newMatrix, actions, hasChanged } = performMove([...matrix], 'right');

            const expectedMatrix = [
                '0', '0', '0', '2',
                '0', '0', '0', '2',
                '0', '0', '0', '2',
                '0', '0', '0', '2'
            ];

            expect(newMatrix).toEqual(expectedMatrix);
            expect(hasChanged).toBe(true);
            // A simple check for actions. A more detailed check could be added.
            expect(actions.length).toBe(4);
            expect(actions).toContainEqual({ from: 0, to: 3, value: '2', isMerge: false });
            expect(actions).toContainEqual({ from: 5, to: 7, value: '2', isMerge: false });
            expect(actions).toContainEqual({ from: 10, to: 11, value: '2', isMerge: false });
            expect(actions).toContainEqual({ from: 15, to: 15, value: '2', isMerge: false });
        });

        test('should merge tiles when moving and return correct actions', () => {
            const matrix = [
                '2', '2', '0', '0',
                '4', '4', '0', '0',
                '8', '0', '8', '0',
                '0', '0', '0', '0'
            ];

            const { newMatrix, scoreChange, actions, hasChanged } = performMove([...matrix], 'left');

            const expectedMatrix = [
                '4', '0', '0', '0',
                '8', '0', '0', '0',
                '16', '0', '0', '0',
                '0', '0', '0', '0'
            ];

            expect(newMatrix).toEqual(expectedMatrix);
            expect(scoreChange).toBe(4 + 8 + 16);
            expect(hasChanged).toBe(true);
            expect(actions).toContainEqual({ from: 0, to: 0, value: '2', isMerge: true });
            expect(actions).toContainEqual({ from: 1, to: 0, value: '2', isMerge: true });
            expect(actions).toContainEqual({ from: 4, to: 4, value: '4', isMerge: true });
            expect(actions).toContainEqual({ from: 5, to: 4, value: '4', isMerge: true });
            expect(actions).toContainEqual({ from: 8, to: 8, value: '8', isMerge: true });
            expect(actions).toContainEqual({ from: 10, to: 8, value: '8', isMerge: true });
        });

        test('should not change the board if no move is possible', () => {
            const matrix = [
                '2', '4', '8', '16',
                '4', '2', '16', '8',
                '8', '16', '2', '4',
                '16', '8', '4', '2'
            ];

            const { newMatrix, scoreChange, actions, hasChanged } = performMove([...matrix], 'left');
            expect(newMatrix).toEqual(matrix);
            expect(scoreChange).toBe(0);
            expect(hasChanged).toBe(false);
            // Actions might still be generated for non-moving tiles
            expect(actions.length).toBe(16);
        });
    });
});
