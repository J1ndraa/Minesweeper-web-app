/*
 * @file: deleteTime.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: function to delete user's time from the leaderboard
 * @date: December 2024
 */

//function to delete user's time from the leaderboard
export const deleteTime = async (difficulty: string) => {
    const response = await fetch("http://localhost:5000/api/leaderboard", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ difficulty: difficulty }),
      credentials: "include",
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete the time from leaderboard.");
    }

    return;
  };