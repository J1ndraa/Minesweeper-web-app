export const getTopTen = async (changeDifficulty) => {
    const response = await fetch(`http://localhost:5000/api/leaderboard?difficulty=${changeDifficulty}`, {
      method: "GET",
      credentials: "include",
    });
  
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch the leaderboard.");
    }
  
    const topten = await response.json();
    return [topten.leaderboard, topten.user];
  };
  