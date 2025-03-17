/**
 * @file boardDoard.ts
 * @brief Defines the GameBoard interface for the Minesweeper game.
 *
 * @details
 * This file defines the `GameBoard` interface, which represents
 * the entire game board for the Minesweeper game, including its cells,
 * status, and difficulty level.
 *
 * @author Marek Čupr
 * @date 2024-10-25
 */

import { BoardCell } from "./boardCell";
import { BoardDetails } from "./boardDetails";
import { BoardStatus } from "./boardStatus";
import { Difficulty } from "./difficulty";

export interface GameBoard {
  /**
   * Details about the game board, including its dimensions (rows x columns)
   * and the total number of mines on the board.
   */
  details: BoardDetails;

  /**
   * A 2D array that represents the state of each cell on the board.
   */
  board: BoardCell[][];

  /**
   * The current status of the game, indicating whether it has started,
   * and whether the player has won or lost.
   */
  status: BoardStatus;

  /**
   * The difficulty level of the game, which influences the configuration
   * of the board and the placement of mines.
   */
  difficulty: Difficulty;
}

/* End of gameDoard.ts */
