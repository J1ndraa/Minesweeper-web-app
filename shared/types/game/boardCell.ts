/**
 * @file boardCell.ts
 * @brief Defines the BoardCell interface for the Minesweeper game.
 *
 * @details
 * This file defines the `BoardCell` interface, which represents a single cell
 * on the Minesweeper game board. Each cell has the following properties:
 * - `value`: The number of adjacent mines.
 * - `isRevealed`: A boolean indicating whether the cell is revealed.
 * - `isFlagged`: A boolean indicating whether the cell is flagged.
 * - `isFlagged`: A boolean indicating whether a hint was used on the cell.
 *
 * @author Marek Čupr
 * @date 2024-10-25
 */

export interface BoardCell {
  value: number;
  isRevealed: boolean;
  isFlagged: boolean;
  isHintUsed: boolean;
}

/* End of boardCell.ts */
