/**
 * @file boardStatus.ts
 * @brief Defines the BoardStatus interface for the Minesweeper game.
 *
 * @details
 * This file defines the `BoardStatus` interface, which represents the current status
 * of the game board in the Minesweeper game. The interface includes the following properties:
 * - `isStarted`: A boolean indicating whether the game has started.
 * - `isLost`: A boolean indicating whether the player has lost the game.
 * - `isWon`: A boolean indicating whether the player has won the game.
 *
 * @author Marek Čupr
 * @date 2024-10-25
 */

export interface BoardStatus {
  isStarted: boolean;
  isLost: boolean;
  isWon: boolean;
}

/* End of boardStatus.ts */
