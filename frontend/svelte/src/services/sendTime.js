export const sendTime = async (time, diff) => {
  try {
    console.log(time,diff);
    const response = await fetch("http://localhost:5000/api/leaderboard",
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          elapsedTime: time,
          difficulty: diff,
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to send data to the leaderboard");
    } else {
      console.log("Time successfully sent to the leaderboard");
    }
  } catch (error) {
    console.error("Error sending data to the backend:", error);
  }
};
