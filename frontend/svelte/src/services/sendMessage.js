export const sendMessage = async (message) => {
    try {
        const response = await fetch("http://localhost:5000/api/chat", {
        method: "PATCH",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
        });

        if (response.ok) {
        console.log("Message sent successfully");
        } else {
        console.error("Failed to send message", await response.json());
        }
    } catch (error) {
        console.error("Error sending message:", error);
    }
};