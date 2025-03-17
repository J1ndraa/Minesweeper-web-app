import { Message } from "../../../../../shared/types/chat";

export const getMessages = async () => {
  const response = await fetch("http://localhost:5000/api/chat");

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to send the message.");
  }

  const data: Message[] = await response.json();
  const sortedMessages: Message[] = data.sort(
    (a: Message, b: Message) => a.timestamp.seconds - b.timestamp.seconds
  );

  return sortedMessages;
};
