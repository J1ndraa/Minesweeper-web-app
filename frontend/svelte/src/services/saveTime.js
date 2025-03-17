export const saveTime = async (elapsedTime) => {
    const response = await fetch("http://localhost:5000/api/time", {
        method: "POST",
        credentials: "include",
        headers: {
        "Content-Type": "application/json",
        },
        body: JSON.stringify({ time: elapsedTime }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch the board.");
      }
}