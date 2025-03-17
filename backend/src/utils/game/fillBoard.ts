/**
 * @file   fillBoard.ts
 * @brief  Randomly populates the board with mines and calculates the adjacent cell values.
 *
 * @details
 * The `fill_board` function populates the board with a specified number of mines in random positions.
 * After placing each mine, the function updates the surrounding cells with a count of adjacent mines.
 *
 * @note   The function uses a constant value of -1 to represent a mine cell.
 *
 * @author Marek Čupr
 * @date   2024-10-25
 */

import { BoardCell, BoardDetails } from "../../../../shared/types/game";

// Constant value that identifies a mine cell
const MINE_VALUE = -1;

/**
 * Fills the game board randomly with mines and updates the values of adjacent cells.
 *
 * @param board   - A 2D array of `BoardCell` representing the board.
 * @param details - An object containing the dimensions of the board and the total number of mines.
 * @returns A 2D array of `BoardCell` representing the filled game board.
 */
export const fillBoard = (
  board: BoardCell[][],
  details: BoardDetails
): BoardCell[][] => {
  const { rows, cols, mines } = details;

  let minesCreated = 0;
  // Randomly place mines until the specified count is reached
  while (minesCreated < mines) {
    // Generate random mine coordinates
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);

    // Check if the randomly selected cell is already occupied by a mine
    if (board[randomRow][randomCol].value !== MINE_VALUE) {
      // Place the mine at the randomly selected cell
      board[randomRow][randomCol].value = MINE_VALUE;

      // Update the values of the adjacent cells
      for (let i = randomRow - 1; i <= randomRow + 1; ++i) {
        for (let j = randomCol - 1; j <= randomCol + 1; ++j) {
          // Ensure we are within the board bounds and the cell is not a mine
          if (
            i >= 0 &&
            i < rows &&
            j >= 0 &&
            j < cols &&
            board[i][j].value !== MINE_VALUE
          ) {
            // Increment the count of adjacent mines
            board[i][j].value++;
          }
        }
      }

      // Increment the counter for successfully placed mines
      minesCreated++;
    }
  }

  // Return the board filled with mines and adjacent counts
  return board;
};

/* End of fillBoard.ts */
