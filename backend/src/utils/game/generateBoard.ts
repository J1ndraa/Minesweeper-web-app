/**
 * @file   generateBoard.ts
 * @brief  Generates a new game board.
 *
 * @details
 * The `generate_board` function creates a new game board based on the specified difficulty level.
 * It retrieves the board details, generates the board cells, and initializes the game status.
 *
 * @author Marek Čupr
 * @date   2024-10-25
 */

import {
  GameBoard,
  BoardDetails,
  BoardCell,
  Difficulty,
} from "../../../../shared/types/game";
import { getBoard } from "./getBoard";
import { getBoardDetails } from "./getBoardDetails";

/**
 * Generates a new game board with all the details, game status, and difficulty.
 *
 * @param difficulty - The difficulty level of the game.
 * @returns A `GameBoard` containing the details and the generated game board.
 */
export const generateBoard = (difficulty: Difficulty): GameBoard => {
  // Retrieve the board details based on the specified difficulty
  const boardDetails: BoardDetails = getBoardDetails(difficulty);

  // Generate the board based on the board details
  const board: BoardCell[][] = getBoard(boardDetails);

  // Return the fully constructed game board
  return {
    details: boardDetails,
    board: board,
    status: {
      isStarted: false,
      isLost: false,
      isWon: false,
    },
    difficulty: difficulty,
  };
};

/* End of generateBoard.ts */
