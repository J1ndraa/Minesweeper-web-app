/*
 * @file: regUser.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: Function that registers the user with a nickname in the backend
 * @date: December 2024
 */

//Function to send a nickname to backend and register the user
export const regUser = async (nickname: string) => {
  const response = await fetch("http://localhost:5000/api/user", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ nickname: nickname }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch the user.");
    }

    return; 
}