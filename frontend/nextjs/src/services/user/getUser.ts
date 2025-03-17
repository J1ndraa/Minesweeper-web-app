export const getUser = async (): Promise<string> => {
  //
  const response = await fetch("http://localhost:5000/api/user", {
    method: "GET",
    credentials: "include",
  });

  //
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch the user.");
  }

  //
  const { nickname } = await response.json();
  return nickname;
};
