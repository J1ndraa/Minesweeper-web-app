export const getChat = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/chat");
      const data = await response.json();
    //   console.log(data);
      const sortedMessages = data.sort(
        (a, b) => a.timestamp.seconds - b.timestamp.seconds
      );
      return sortedMessages;
    //   setMessages(sortedMessages); // Update the state with the fetched messages
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };