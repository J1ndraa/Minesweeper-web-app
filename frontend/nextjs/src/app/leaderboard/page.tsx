/**
 * @file    page.tsx
 * @author  Marek Čupr
 * @date    2024-11-12
 *
 * @brief   Leaderboard page for the Minesweeper game application. This page displays the leaderboard for the selected difficulty
 *          and allows users to view their fastest times, change difficulty, and delete their fastest times.
 *
 * @details This component shows the leaderboard for the selected difficulty (easy, medium, or hard),
 *          including the user's position and fastest time if available. Users can also delete their fastest time.
 *          It handles loading states and errors gracefully.
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/useToast";
import { deleteTime } from "@/services/leaderboard/deleteTime";
import { fetchLeaderboard } from "@/services/leaderboard/fetchLeaderBoard";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useState } from "react";
import {
  LeaderBoard,
  LeaderBoardCell,
} from "../../../../../shared/types/leaderboard";

const LeaderboardPage = () => {
  // User's nickname
  const [nickname, setNickname] = useState("");
  // Selected difficulty level
  const [difficulty, setDifficulty] = useState("medium");
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  // User's current leaderboard position
  const [userPosition, setUserPosition] = useState<number | null>(null);
  // User's fastest time
  const [userFastestTime, setUserFastestTime] = useState<number | null>(null);
  // Leaderboard data
  const [leaderboard, setLeaderboard] = useState<LeaderBoardCell[] | null>(
    null
  );
  // Toast notification
  const { toast } = useToast();

  /**
   * @brief   Handles the leaderboard fetching.
   * @details This function fetches the leaderboard based on the selected difficulty,
   *          updates the user's position and fastest time, and handles errors with a toast notification.
   */
  const handleFetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch leaderboard of the fastest times
      const data: LeaderBoard = await fetchLeaderboard(difficulty);
      setLeaderboard(data.leaderboard);

      // Set the current user's information
      const user = data.user;
      if (user.nickname) {
        setNickname(user.nickname);
      }

      // Check if the user has valid time for the specified difficulty
      if (user.fastestTime && user.position) {
        setUserFastestTime(user.fastestTime);
        setUserPosition(user.position);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Error Occurred",
          description: error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [difficulty, toast]);

  // Fetch the leaderboard information
  useEffect(() => {
    handleFetchLeaderboard();
  }, [difficulty, handleFetchLeaderboard]);

  const change_difficulty = async (difficulty: string) => {
    setDifficulty(difficulty);
  };

  /**
   * @brief   Handles the user's time deletion.
   * @details This function removes the user's fastest time for
   *          the chosen difficulty.
   */
  const handleDeleteTime = async () => {
    try {
      // Delete the user's fastest time
      await deleteTime(difficulty);
      // Update the leaderboard
      handleFetchLeaderboard();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Error Occurred",
          description: error.message,
        });
      }
    }
  };

  return (
    <div className="h-full bg-[url('/background.png')] bg-cover bg-left bg-no-repeat md:bg-cover md:bg-center flex flex-col items-center gap-10 p-8 2xl:p-10 max-lg:py-12 py-6">
      {/* Main Heading */}
      <h1 className="text-center text-5xl sm:text-6xl lg:text-[64px] 2xl:text-7xl relative">
        <Link href={"/"}>
          <Button
            size={"xl"}
            variant={"secondary"}
            className="absolute max-lg:hidden top-5 -left-52 lg:-left-64 xl:-left-72 text-sm sm:text-md lg:text-xl 2xl:text-2xl flex items-center gap-3 group"
          >
            <span className="">Menu</span>
            <Image
              src={"/menu.png"}
              alt="Menu Icon"
              width={35}
              height={35}
              className="w-5 h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 2xl:w-9 2xl:h-9 transition-transform duration-300 ease-out group-hover:scale-105"
            />
          </Button>
        </Link>
        <Link href={"/"}>MINESWEEPER</Link>
        <div></div>
      </h1>

      {/* Leaderboard Section */}
      <div className="w-[95%] md:w-[85%] lg:w-[70%] max-w-5xl p-4 rounded-xl bg-white/10 backdrop-blur-md border-4">
        {/* Difficulty Selector */}
        <Select
          defaultValue="medium"
          onValueChange={(val) => change_difficulty(val)}
        >
          <SelectTrigger className="w-[180px] mb-4">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent className="bg-white/10 backdrop-blur-md text-white">
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        {isLoading ? (
          // Loading Spinner
          <div className="grid place-content-center p-10">
            <div
              className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-danger motion-reduce:animate-[spin_1.5s_linear_infinite]"
              role="status"
            >
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
          </div>
        ) : (
          // Leaderboard Table
          <Table className="">
            <TableHeader>
              <TableRow className="text-white">
                <TableHead className="w-[100px] text-white">Position</TableHead>
                <TableHead className="text-white">Nickname</TableHead>
                <TableHead className="text-right text-white">
                  Time (s)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Fastest Times */}
              {leaderboard && leaderboard.length > 0 ? (
                leaderboard?.map((entry, index) => (
                  <TableRow
                    key={index}
                    className={`${
                      entry.nickname === nickname && "bg-[#607d8b]"
                    }`}
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="">{entry.nickname}</TableCell>
                    <TableCell className="text-right flex justify-end gap-4">
                      {Math.floor(entry.fastestTime / 60)}:
                      {(entry.fastestTime % 60).toString().padStart(2, "0")}
                      {entry.nickname === nickname && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Trash2
                                onClick={() => handleDeleteTime()}
                                className="w-5 h-5 hover:text-red-500 transition-all duration-500 ease-in-out cursor-pointer"
                              />
                            </TooltipTrigger>
                            <TooltipContent className="text-sm">
                              <p>
                                Delete your fastest time for {difficulty}{" "}
                                difficulty.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  {/* No Data Fetched */}
                  <TableCell colSpan={3} className="text-center">
                    No data available.
                  </TableCell>
                </TableRow>
              )}
              {/* User's Fastest Times */}
              {userFastestTime && userPosition && (
                <TableRow className={"bg-[#607d8b]"}>
                  <TableCell className="font-medium">{userPosition}</TableCell>
                  <TableCell>{nickname}</TableCell>
                  <TableCell className="text-right flex justify-end gap-4">
                    {Math.floor(userFastestTime / 60)}:
                    {(userFastestTime % 60).toString().padStart(2, "0")}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Trash2
                            onClick={() => handleDeleteTime()}
                            className="w-5 h-5 hover:text-red-500 transition-all duration-500 ease-in-out cursor-pointer"
                          />
                        </TooltipTrigger>
                        <TooltipContent className="text-sm">
                          <p>
                            Delete your fastest time for {difficulty}{" "}
                            difficulty.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;

// End of page.tsx
