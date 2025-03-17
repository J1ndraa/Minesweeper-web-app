import { GameBoard } from "@/../../../shared/types/game";

export const countMinesLeft = (gameBoard: GameBoard) => {
  const flaggedMines =
    gameBoard?.board?.flat().filter((cell) => cell.isFlagged).length ?? 0;

  const totalMines = gameBoard?.details?.mines ?? 0;
  return totalMines - flaggedMines;
};
