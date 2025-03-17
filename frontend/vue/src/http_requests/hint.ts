/*
 * @file: hint.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: Function for sending a request to the backend to process a hint for the user
 * @date: December 2024
 */

//hint function to send a request to the backend to process a hint
export const hint = async (action: string) => {
    const response = await fetch("http://localhost:5000/api/hint", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch the updated board.");
    }

    //send updated board as a response to the frontend
    const updatedBoard = await response.json();
    return updatedBoard;
};