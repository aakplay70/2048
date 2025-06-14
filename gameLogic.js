// Pure game logic functions for the 2048 game

/**
 * Merges tiles in a single row or column
 * @param {string[]} tiles - Array of tile values ('0' for empty)
 * @returns {string[]} Merged tiles
 */
function mergeTiles(tiles) {
    const actions = [];
    let score = 0;
    const nonEmptyTiles = tiles.map((value, index) => ({ value, originalIndex: index }))
                             .filter(tile => tile.value !== '0');

    const mergedLine = [];
    for (let i = 0; i < nonEmptyTiles.length; i++) {
        if (i + 1 < nonEmptyTiles.length && nonEmptyTiles[i].value === nonEmptyTiles[i + 1].value) {
            const mergedValue = (parseInt(nonEmptyTiles[i].value) * 2).toString();
            score += parseInt(mergedValue);

            const fromIndex1 = nonEmptyTiles[i].originalIndex;
            const fromIndex2 = nonEmptyTiles[i + 1].originalIndex;
            const toIndex = mergedLine.length;

            actions.push({ from: fromIndex1, to: toIndex, value: nonEmptyTiles[i].value, isMerge: true });
            actions.push({ from: fromIndex2, to: toIndex, value: nonEmptyTiles[i + 1].value, isMerge: true });

            mergedLine.push(mergedValue);
            i++; // Skip next tile
        } else {
            const fromIndex = nonEmptyTiles[i].originalIndex;
            const toIndex = mergedLine.length;
            actions.push({ from: fromIndex, to: toIndex, value: nonEmptyTiles[i].value, isMerge: false });
            mergedLine.push(nonEmptyTiles[i].value);
        }
    }

    const finalTiles = [...mergedLine];
    while (finalTiles.length < 4) {
        finalTiles.push('0');
    }

    return { merged: finalTiles, score, actions };
}



/**
 * Performs a move in the specified direction
 * @param {string[]} matrix - Current game state (flattened 4x4 grid)
 * @param {string} direction - 'up', 'down', 'left', or 'right'
 * @returns {string[]} New game state after the move
 */
function performMove(matrix, direction) {
    const newMatrix = Array(16).fill('0');
    let totalScore = 0;
    const allActions = [];
    let hasChanged = false;

    for (let i = 0; i < 4; i++) {
        let line = [];
        let indices = [];

        for (let j = 0; j < 4; j++) {
            let index;
            switch (direction) {
                case 'left': index = i * 4 + j; break;
                case 'right': index = i * 4 + (3 - j); break;
                case 'up': index = j * 4 + i; break;
                case 'down': index = (3 - j) * 4 + i; break;
            }
            line.push(matrix[index]);
            indices.push(index);
        }

        const { merged, score, actions } = mergeTiles(line);
        totalScore += score;

        actions.forEach(action => {
            allActions.push({
                from: indices[action.from],
                to: indices[action.to],
                value: action.value,
                isMerge: action.isMerge
            });
        });

        for (let j = 0; j < 4; j++) {
            newMatrix[indices[j]] = merged[j];
        }
    }

    // Check if the board has changed
    if (JSON.stringify(matrix) !== JSON.stringify(newMatrix)) {
        hasChanged = true;
    }

    return { newMatrix, scoreChange: totalScore, actions: allActions, hasChanged };
}

export { mergeTiles, performMove };
