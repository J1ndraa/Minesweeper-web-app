/*
 * @file: getChatMsgs.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: Function for fetching chat messages from the backend
 * @date: December 2024
 */

export const getChatMsgs = async() => {
    const response = await fetch("http://localhost:5000/api/chat", {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message);
    }

    const msgs = await response.json();
    const sortedMessages = msgs.sort((a:any, b:any) => a.timestamp.seconds - b.timestamp.seconds);

    return sortedMessages;
}   