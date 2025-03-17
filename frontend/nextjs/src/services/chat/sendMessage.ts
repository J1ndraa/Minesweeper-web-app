export const sendMessage = async (message: string) => {
  const response = await fetch("http://localhost:5000/api/chat", {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to send the message.");
  }
};
