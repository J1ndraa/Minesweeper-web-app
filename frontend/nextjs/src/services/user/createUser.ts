export const createUser = async (nickname: string): Promise<string> => {
  //
  const response = await fetch("http://localhost:5000/api/user", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ nickname }),
  });

  //
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch the board.");
  }

  //
  const data = await response.json();
  return data;
};
