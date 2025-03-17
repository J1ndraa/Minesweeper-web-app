/*
 * @file: count-mines-left.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: count the number of mines left in the game, inspired by the code of my project colegue - (xcuprm01) Čupr Marek
 * @date: December 2024
 */

//returns: the number of mines in the game minus the number of flagged cells.
import { GameBoard } from "@/../../../shared/types/game";

export const count_mines_left = (gameBoard: GameBoard) => {
  const flagged_mines = gameBoard?.board?.flat().filter((cell) => cell.isFlagged).length ?? 0;
  const total_mines = gameBoard?.details?.mines ?? 0;
  return (total_mines - flagged_mines);
};
