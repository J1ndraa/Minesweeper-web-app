/*
 * @file: getUser.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: Function that fetches the user's nickname from the backend if it exists
 * @date: December 2024
 */

//Get user's nickname from backend
//its stored in cookies
export const getUser = async (): Promise<string> => {
  const response = await fetch("http://localhost:5000/api/user", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch the user.");
  }

  //return the user's nickname
  const { nickname } = await response.json();
  return nickname;
};
