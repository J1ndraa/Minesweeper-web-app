export const sendTime = async (elapsedTime: number, difficulty: string) => {
  const response = await fetch("http://localhost:5000/api/leaderboard", {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      elapsedTime,
      difficulty,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update the time.");
  }
};
