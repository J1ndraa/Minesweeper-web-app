import { GameBoard } from "@/../../../shared/types/game";

export const getHint = async (action: string): Promise<GameBoard> => {
  const response = await fetch("http://localhost:5000/api/hint", {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch the updated board.");
  }

  const updatedBoard = await response.json();
  return updatedBoard;
};
