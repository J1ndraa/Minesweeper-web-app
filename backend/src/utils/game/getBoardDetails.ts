/**
 * @file   getBoardDetails.ts
 * @brief  Provides a function to retrieve game board details based on the difficulty level.
 *
 * @details
 * The `get_board_details` function accepts a difficulty level as a parameter and returns
 * the corresponding board dimensions (rows x columns) and the number of mines to be created.
 *
 * @note   Supports three difficulty levels: Easy, Medium, and Hard.
 *
 * @author Marek Čupr
 * @date   2024-10-25
 */

import { BoardDetails, Difficulty } from "../../../../shared/types/game";

/**
 * Returns board details (rows, columns, and mines) based on the difficulty level.
 *
 * @param   difficulty - The difficulty level for which board details are required (Easy, Medium, or Hard).
 * @returns A `BoardDetails` containing the number of rows, columns, and mines.
 * @throws  Will throw an error if the difficulty level is not recognized.
 */
export const getBoardDetails = (difficulty: Difficulty): BoardDetails => {
  switch (difficulty) {
    case Difficulty.Easy:
      return { rows: 8, cols: 8, mines: 8 };
    case Difficulty.Medium:
      return { rows: 10, cols: 10, mines: 15 };
    case Difficulty.Hard:
      return { rows: 15, cols: 15, mines: 45 };
    default:
      throw new Error("Invalid difficulty level");
  }
};

/* End of getBoardDetails.ts */
