/*
 * @file: revealCell.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: Function to reveal a cell in the game
 * @date: December 2024
 */

import { GameBoard } from "@/../../../shared/types/game";

//Function to reveal a cell
//it sends necessary data to backend, its row and column key, (x,y) coordinates
export const revealCell = async (rowKey: number, colKey: number): Promise<GameBoard> => {
  const response = await fetch("http://localhost:5000/api/action", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      row: rowKey,
      col: colKey,
      action: "reveal",
    }),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch the updated board.");
  }

  //return the updated board
  const updatedBoard = await response.json();
  return updatedBoard;
};
