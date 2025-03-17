/**
 * @file   getBoard.ts
 * @brief  Generates an initial game board with the specified dimensions and mines.
 *
 * @details
 * The `get_board` function initializes the board with default cell properties, then uses `fill_board`
 * to add mines and adjacent mine counts.
 *
 * @author Marek Čupr
 * @date   2024-10-25
 */

import { BoardCell, BoardDetails } from "../../../../shared/types/game";
import { fillBoard } from "./fillBoard";

/**
 * Generates the game board.
 *
 * @param details - Board dimensions and mines count.
 * @returns A 2D array of `BoardCell` objects representing the board.
 */
export const getBoard = (details: BoardDetails): BoardCell[][] => {
  const { rows, cols } = details;

  // Initialize the board with default cell properties
  let board: BoardCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      value: 0,
      isRevealed: false,
      isFlagged: false,
      isHintUsed: false,
    }))
  );

  // Populate the board with mines and adjacent counts
  return fillBoard(board, details);
};

/* End of getBoard.ts */
