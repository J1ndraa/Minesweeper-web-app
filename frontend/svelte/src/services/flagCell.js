export const flagCell = async (rowKey, colKey, gameBoard) => {
  const response = await fetch("http://localhost:5000/api/action", {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      row: rowKey,
      col: colKey,
      action: "flag",
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch the updated board.");
  }

  const updatedBoard = await response.json();
  return updatedBoard;
};
