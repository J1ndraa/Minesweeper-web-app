export const createUser = async (nickname) => {
  const response = await fetch("http://localhost:5000/api/user", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      nickname: nickname,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create the user.");
  }

  const { newnickname } = await response.json();
  return newnickname;
};
