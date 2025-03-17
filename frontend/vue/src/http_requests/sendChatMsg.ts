/*
 * @file: sendChatMsg.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: Function that handles sending chat messages to the backend
 * @date: December 2024
 */

//send patch request to the backend with the message
export const sendChatMsg = async (msg: string) => {
    const be_response = await fetch("http://localhost:5000/api/chat", {
		method: "PATCH",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({ message: msg }),
		credentials: "include",
	});

	if (!be_response.ok) {
		throw new Error("Error: " + be_response.status);
	}

    return;
}