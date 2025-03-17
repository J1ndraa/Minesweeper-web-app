/**
 * @file   checkWin.ts
 * @brief
 *
 * @details
 *
 * @author Marek Čupr
 * @date   2024-11-08
 */

import { GameBoard } from "../../../../shared/types/game";

/**
 * @brief
 *
 * @param gameBoard - The current state of the game board.
 * @returns
 */
export const checkWin = (gameBoard: GameBoard): boolean => {
  const { board } = gameBoard;

  // Iterate through each cell to check for the win condition
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];

      // Check if all non-mine cells are revealed
      if (cell.value === -1 && cell.isRevealed) {
        return false;
      }

      // Check if any bomb isn't revealed
      if (cell.value !== -1 && !cell.isRevealed) {
        return false;
      }
    }
  }

  return true;
};

/* End of checkWin.ts */
