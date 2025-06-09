// Pure game logic functions for the 2048 game

/**
 * Merges tiles in a single row or column
 * @param {string[]} tiles - Array of tile values ('0' for empty)
 * @returns {string[]} Merged tiles
 */
function mergeTiles(tiles) {
  // Filter out empty tiles
  const nonEmptyTiles = tiles.filter(tile => tile !== '0');
  const mergedTiles = [];
  
  // If no tiles to merge, return all zeros
  if (nonEmptyTiles.length === 0) {
    return { merged: ['0', '0', '0', '0'], score: 0 };
  }
  
  let score = 0;
  let i = 0;
  
  while (i < nonEmptyTiles.length) {
    // If current and next tiles are the same and not zero, merge them
    if (i + 1 < nonEmptyTiles.length && nonEmptyTiles[i] === nonEmptyTiles[i + 1]) {
      const mergedValue = (parseInt(nonEmptyTiles[i]) * 2).toString();
      score += parseInt(mergedValue);
      mergedTiles.push(mergedValue);
      i += 2; // Skip the next tile as it's been merged
    } else {
      // Just add the current tile
      mergedTiles.push(nonEmptyTiles[i]);
      i++;
    }
  }
  
  // Fill the rest with empty tiles
  while (mergedTiles.length < 4) {
    mergedTiles.push('0');
  }
  
  return { merged: mergedTiles, score };
}



/**
 * Performs a move in the specified direction
 * @param {string[]} matrix - Current game state (flattened 4x4 grid)
 * @param {string} direction - 'up', 'down', 'left', or 'right'
 * @returns {string[]} New game state after the move
 */
function performMove(matrix, direction) {
  const newMatrix = [...matrix];
  let totalScore = 0;
  
  // Process each row or column based on direction
  for (let i = 0; i < 4; i++) {
    let tiles = [];
    let indices = [];
    
    // Extract the row or column and remember their original indices
    for (let j = 0; j < 4; j++) {
      let index;
      switch (direction) {
        case 'left':
          // Left: process left to right
          index = i * 4 + j;
          break;
        case 'right':
          // Right: process right to left
          index = i * 4 + (3 - j);
          break;
        case 'up':
          // Up: process top to bottom
          index = j * 4 + i;
          break;
        case 'down':
          // Down: process bottom to top
          index = (3 - j) * 4 + i;
          break;
        default:
          return { newMatrix, scoreChange: 0 };
      }
      tiles.push(newMatrix[index]);
      indices.push(index);
    }
    
    // Process the tiles (merge and move)
    const result = mergeTiles(tiles);
    
    // Update the total score
    totalScore += result.score;
    
    // Put the processed tiles back in their original positions
    for (let j = 0; j < 4; j++) {
      newMatrix[indices[j]] = result.merged[j];
    }
  }
  
  return { newMatrix, scoreChange: totalScore };
}

export { mergeTiles, performMove };
