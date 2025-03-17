import { GameBoard } from "../../../../shared/types/game";
import { updateBoard } from "./updateBoard";

export const useHint = (
  gameBoard: GameBoard,
  action: "reveal" | "flag"
): GameBoard => {
  const board = gameBoard.board;

  switch (action) {
    case "reveal":
      // Iterate through each cell to check for the win condition
      for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
          const cell = board[row][col];

          if (cell.value !== -1 && !cell.isRevealed) {
            cell.isHintUsed = true;
            return updateBoard(gameBoard, row, col, "reveal");
          }
        }
      }
      break;
    case "flag":
      // Iterate through each cell to check for the win condition
      for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
          const cell = board[row][col];

          if (cell.value === -1 && !cell.isFlagged) {
            cell.isHintUsed = true;
            cell.isFlagged = true;
            return gameBoard;
          }
        }
      }
      break;
  }

  return gameBoard;
};
