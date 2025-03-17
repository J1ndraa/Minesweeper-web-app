import { LeaderBoard } from "@/../../../shared/types/leaderboard";

export const fetchLeaderboard = async (
  difficulty: string
): Promise<LeaderBoard> => {
  const response = await fetch(
    `http://localhost:5000/api/leaderboard?difficulty=${difficulty}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete the leaderboard.");
  }

  const data = (await response.json()) as LeaderBoard;
  return data;
};
