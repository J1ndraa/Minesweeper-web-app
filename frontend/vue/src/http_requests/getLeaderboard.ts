/*
 * @file: getLeaderboard.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: Function for fetching leaderboard data from the backend
 * @date: December 2024
 */

//Get leaderboard data based on difficulty
export const getLeaderboard = async (difficulty: string) => {
    const response = await fetch(`http://localhost:5000/api/leaderboard?difficulty=${difficulty}`, {
        method: "GET",
        credentials: "include",
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch the leaderboard.");
    }

    //store response data in a variable
    const data = await response.json();

    console.log("Server response:", data);
    
    //Return leaderboard, fastest time, and user's position in an array
    return [data.leaderboard, data.fastestTime, data.position];
};
    