/**
 * @file   getDifficulty.ts
 * @brief  Converts a string difficulty level into an enumerated `Difficulty` value.
 *
 * @details
 * The `get_difficulty` function maps a string representing the difficulty level ("easy", "medium", or "hard")
 * to the corresponding `Difficulty` enum value. If an invalid string is provided, it defaults to `Difficulty.Medium`.
 *
 * @note   Supports three difficulty levels: Easy, Medium, and Hard.
 *
 * @author Marek Čupr
 * @date   2024-10-25
 */

import { Difficulty } from "../../../../shared/types/game";

/**
 * Converts a string difficulty level into a `Difficulty` enum value.
 *
 * @param   difficulty - A string representing the difficulty ("easy", "medium", "hard").
 * @returns The corresponding `Difficulty` enum value.
 * @throws  Will throw an error if the difficulty level is not recognized.
 */
export const getDifficulty = (difficulty: string): Difficulty => {
  switch (difficulty) {
    case "easy":
      return Difficulty.Easy;
    case "medium":
      return Difficulty.Medium;
    case "hard":
      return Difficulty.Hard;
    default:
      throw new Error("Invalid difficulty level");
  }
};

/* End of getDifficulty.ts */
