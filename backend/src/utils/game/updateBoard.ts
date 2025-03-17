/**
 * @file   updateBoard.ts
 * @brief  Updates the game board based on user actions (reveal or flag).
 *
 * @details
 * The `update_board` function updates the board by either revealing a cell or flagging it. It also handles game
 * state transitions, such as starting the game when a cell is revealed, and determining if the game is lost.
 *
 * @author Marek Čupr
 * @date   2024-10-25
 */

import { GameBoard } from "../../../../shared/types/game";
import { generateBoard } from "./generateBoard";
import { revealCell } from "./revealCell";
import { checkWin } from "./checkWin";

/**
 * Updates the board based on the given action (reveal or flag).
 *
 * - If "reveal", the function reveals the specified cell and starts the game if it is the first cell revealed.
 * - If "flag", it toggles the flag on the specified cell.
 *
 * @param gameBoard - The current state of the game board.
 * @param row       - The row index of the cell to update.
 * @param col       - The column index of the cell to update.
 * @param action    - The action to perform: either "reveal" or "flag".
 * @returns The updated `gameBoard` object.
 */
export const updateBoard = (
  gameBoard: GameBoard,
  row: number,
  col: number,
  action: "reveal" | "flag"
): GameBoard => {
  const { board } = gameBoard;

  // Ensure the cell is within the board bounds
  if (row < 0 || row >= board.length || col < 0 || col >= board[0].length) {
    throw new Error("Cell out of range");
  }

  // Get the clicked cell
  const cell = board[row][col];

  // Return early if the game is over (lost or won)
  if (gameBoard.status.isLost || gameBoard.status.isWon) {
    return gameBoard;
  }

  // Perform the specified action on the cell
  switch (action) {
    case "reveal":
      // Skip if the cell is flagged
      if (cell.isFlagged) {
        break;
      }

      // Start the game by revealing the corresponding cells
      if (!gameBoard.status.isStarted) {
        while (gameBoard.board[row][col].value !== 0) {
          // Generate a new board if the first revealed cell has a value of 0
          gameBoard = generateBoard(gameBoard.difficulty);
        }

        // Reveal the corresponding cells
        gameBoard.status.isStarted = true;
        revealCell(gameBoard, row, col);
        break;
      }

      // If the cell is a mine, set the game as lost
      if (cell.value === -1) {
        gameBoard.status.isLost = true;
        cell.isRevealed = true;
      }

      // Reveal the corresponding cells
      revealCell(gameBoard, row, col);

      // Check if the game is won
      gameBoard.status.isWon = checkWin(gameBoard);
      break;
    case "flag":
      // Skip if the cell is revealed
      if (cell.isRevealed) {
        break;
      }

      // Flag or unflag the corresponding cell
      cell.isFlagged = !cell.isFlagged;
      break;
    default:
      throw new Error("Invalid action. Use 'reveal' or 'flag'.");
  }

  // Return the updated board
  return gameBoard;
};

/* End of updateBoard.ts */
