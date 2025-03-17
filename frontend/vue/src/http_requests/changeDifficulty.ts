/*
 * @file: changeDifficulty.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: Function to change the difficulty of the game
 * @date: December 2024
 */

import { GameBoard } from "@/../../../shared/types/game";

//Function to change the difficulty of the game
//It generates a new game board of the new difficulty
export const changeDifficulty = async ( difficulty: string ): Promise<GameBoard> => {
  const response = await fetch("http://localhost:5000/api/reset", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      difficulty: difficulty,
    }),
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch the board.");
  }

  //return the game board
  const gameBoard = await response.json();
  return gameBoard;
};
