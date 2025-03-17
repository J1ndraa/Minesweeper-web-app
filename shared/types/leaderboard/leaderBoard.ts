import { LeaderBoardCell } from "./leaderBoardCell";
import { LeaderBoardUser } from "./leaderBoardUser";

export interface LeaderBoard {
  leaderboard: LeaderBoardCell[];
  user: LeaderBoardUser;
}
