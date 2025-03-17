/**
 * @file   revealCells.ts
 * @brief  Reveals the clicked board cell and its surrounding cells on the game board.
 *
 * @details
 * The `revealCell` function reveals the clicked cell and, if the cell's value is `0`,
 * it will iteratively reveal all its adjacent cells. The function stops revealing if the cell
 * is already revealed, flagged, or contains a mine (value `-1`).
 *
 * @author Marek Čupr
 * @date   2024-10-25
 */

import { GameBoard } from "../../../../shared/types/game";

/**
 * Reveals a specific cell and its surrounding cells on the board.
 *
 * If the cell has a value of `0`, all its adjacent cells will be revealed iteratively.
 * Stops if the cell is revealed, flagged, or contains a mine (value `-1`).
 *
 * @param gameBoard - The board object containing all game cells and details.
 * @param row       - The row index of the cell to reveal.
 * @param col       - The column index of the cell to reveal.
 */
export const revealCell = (
  gameBoard: GameBoard,
  row: number,
  col: number
): void => {
  const { board } = gameBoard;

  // Check if the cell is out of bounds
  if (row < 0 || row >= board.length || col < 0 || col >= board[0].length) {
    return;
  }

  // Get the clicked cell
  const cell = board[row][col];

  // Return if the cell is already revealed, flagged, or contains a mine
  if (cell.isRevealed || cell.isFlagged || cell.value === -1) {
    return;
  }

  // Reveal the current cell
  cell.isRevealed = true;

  // If the cell has a value greater than 0, stop recursion (no adjacent cells need to be revealed)
  if (cell.value > 0) {
    return;
  }

  // Recursively reveal all the adjacent cells
  for (let i = row - 1; i <= row + 1; i++) {
    for (let j = col - 1; j <= col + 1; j++) {
      if (i === row && j === col) {
        continue; // Skip the current cell
      }
      // Recursively reveal adjacent cells
      revealCell(gameBoard, i, j);
    }
  }
};

/* End of revealCells.ts */
