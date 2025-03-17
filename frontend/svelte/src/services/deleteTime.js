export const deleteTime = async (difficulty) => {
  //
  const response = await fetch("http://localhost:5000/api/leaderboard", {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      difficulty: difficulty,
    }),
  });

  //
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete the board.");
  }
};
