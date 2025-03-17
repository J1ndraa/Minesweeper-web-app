export const generateBoard = async () => {
  //
  const response = await fetch("http://localhost:5000/api/board", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      difficulty: "medium",
    }),
  });

  //
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch the board.");
  }

  //
  const gameBoard = await response.json();
  return gameBoard;
};
