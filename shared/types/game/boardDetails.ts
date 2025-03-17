/**
 * @file boardDetails.ts
 * @brief Defines the BoardDetails interface for the Minesweeper game.
 *
 * @details
 * This file defines the `BoardDetails` interface, which encapsulates essential
 * information about the game board in the Minesweeper game. Each game board has the
 * following details:
 * - `rows`: The number of rows on the game board.
 * - `cols`: The number of columns on the game board.
 * - `mines`: The total number of mines present on the game board.
 *
 * @author Marek Čupr
 * @date 2024-10-25
 */

export interface BoardDetails {
  rows: number;
  cols: number;
  mines: number;
}

/* End of boardDetails.ts */
