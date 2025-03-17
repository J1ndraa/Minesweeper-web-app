/*
 * @file: sendTimeToBE.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: Function that sends the play time to the backend
 * @date: December 2024
 */

//send play time to backend, after winning the game
export const sendTimeToBE = async (time: number, difficulty: string): Promise<void> => {
	const be_response = await fetch("http://localhost:5000/api/leaderboard", {
		method: "PATCH",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({ elapsedTime: time, difficulty: difficulty }),
		credentials: "include",
	});

	if (!be_response.ok) {
		throw new Error("Error: " + be_response.status);
	}

	return;  
}