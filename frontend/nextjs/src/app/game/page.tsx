/**
 * @file    page.tsx
 * @author  Marek Čupr
 * @date    2024-11-12
 *
 * @brief   Minesweeper page for the Minesweeper game application. This page Displays the game board for the selected difficulty,
 *          allows users to reveal and flag cells, change difficulty, and shows elapsed time.
 *
 * @details This component manages the Minesweeper game page, including the game board rendering,
 *          user interactions such as cell reveal and flagging, difficulty selection, and game time tracking.
 *          It also handles the fetching and sending of chat messages in the game. It handles loading states and errors gracefully.
 */

"use client";

import { GameBoard } from "@/../../../shared/types/game";
import { Message } from "@/../../../shared/types/chat";
import { useEffect, useRef, useState } from "react";
import { changeDifficulty } from "@/services/board/changeDifficulty";
import { generateBoard } from "@/services/board/generateBoard";
import { redirect } from "next/navigation";
import { getUser } from "@/services/user/getUser";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatTime } from "@/lib/game/formatTime";
import { countMinesLeft } from "@/lib/game/countMinesLeft";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useToast } from "@/hooks/useToast";
import { Eye, LandPlot } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { sendTime } from "@/services/leaderboard/sendTime";
import { getHint } from "@/services/cell/getHint";
import { sendMessage } from "@/services/chat/sendMessage";
import { performAction } from "@/services/cell/performAction";
import { getMessages } from "@/services/chat/getMessages";
import { postTime } from "@/services/leaderboard/getTime";

const GamePage = () => {
  // Current game board
  const [gameBoard, setGameBoard] = useState<GameBoard | null>(null);
  // Last clicked cell
  const [clickedCell, setClickedCell] = useState<[number, number] | null>(null);
  // Elapsed game time
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  // Game difficulty
  const [difficulty, setDifficulty] = useState<string>("medium");
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  // Last send chat message
  const [message, setMessage] = useState("");
  // Fetched chat messages
  const [messages, setMessages] = useState<Message[]>([]);
  // End of messages ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  // Toast notification
  const { toast } = useToast();

  /**
   * @brief   Handles the leaderboard fetching.
   * @details This function fetches the leaderboard based on the selected difficulty,
   *          updates the user's position and fastest time, and handles errors with a toast notification.
   */
  useEffect(() => {
    const handleGetUser = async () => {
      try {
        await getUser();
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast({
            variant: "destructive",
            title: "Error Occurred",
            description: error.message,
          });
        }
        redirect("/");
      }
    };

    handleGetUser();
  }, [toast]);

  /**
   * @brief   Disables the context menu.
   * @details Adds an event listener to prevent the default
   *          context menu on right-click.
   */
  useEffect(() => {
    const handleRightClick = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleRightClick);

    return () => {
      document.removeEventListener("contextmenu", handleRightClick);
    };
  }, []);

  /**
   * @brief   Initializes or loads the game board.
   * @details Fetches a new board or the last saved one and updates the state.
   *          Handles loading state and displays errors via toast notifications.
   */
  useEffect(() => {
    const handleGenerateBoard = async () => {
      setIsLoading(true);
      try {
        const data = await generateBoard();
        const boardData = data.board;
        const time = data.lastTime;

        setDifficulty(boardData.difficulty);
        setGameBoard(boardData);
        if (time) {
          setElapsedTime(time);
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
    };
    handleGenerateBoard();
  }, [toast]);

  /**
   * @brief   Performs an action on the game board.
   * @details Executes an action (e.g., reveal or flag a cell) at the specified position.
   *          Fetches the updated board from the server and updates the state.
   *
   * @param   rowKey Row index of the target cell.
   * @param   colKey Column index of the target cell.
   * @param   action Action to perform ("reveal", etc.).
   */
  const handlePerformAction = async (
    rowKey: number,
    colKey: number,
    action: string
  ) => {
    if (!gameBoard || gameBoard?.status.isLost || gameBoard?.status.isWon) {
      return;
    }

    if (action === "reveal") {
      setClickedCell([rowKey, colKey]);
    }

    try {
      const newBoard = await performAction(rowKey, colKey, action);
      setGameBoard(newBoard);
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

  /**
   * @brief   Handles a change in game difficulty.
   * @details Fetches a new game board for the selected difficulty level,
   *          resets elapsed time, and updates the state. Displays errors via toast notifications.
   *
   * @param   difficulty Selected difficulty level.
   */
  const handleChangeDifficulty = async (difficulty: string) => {
    try {
      const newBoard = await changeDifficulty(difficulty);

      setGameBoard(newBoard);
      setElapsedTime(0);
      setDifficulty(difficulty);
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

  /**
   * @brief   Tracks elapsed time while the game is active.
   * @details Starts a timer when the game is ongoing. Updates elapsed time every second.
   *          Clears the timer when the game ends or the component unmounts.
   */
  useEffect(() => {
    if (
      gameBoard?.status?.isStarted &&
      !gameBoard?.status?.isWon &&
      !gameBoard?.status?.isLost
    ) {
      const timer = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [
    gameBoard?.status?.isStarted,
    gameBoard?.status?.isLost,
    gameBoard?.status?.isWon,
  ]);

  /**
   * @brief   Sends elapsed time to the backend when the game is won.
   * @details Monitors the game state for a win. On win, submits the elapsed time
   *          and difficulty to the backend, handling errors via toast notifications.
   */
  useEffect(() => {
    if (gameBoard?.status?.isWon) {
      const sendTimeToBackend = async () => {
        try {
          await sendTime(elapsedTime, difficulty);
        } catch (error) {
          if (error instanceof Error) {
            toast({
              variant: "destructive",
              title: "Error Occurred",
              description: error.message,
            });
          }
        }
      };

      sendTimeToBackend();
    }
  }, [gameBoard?.status?.isWon, elapsedTime, difficulty, toast]);

  /**
   * @brief   Sends the elapsed time to the server before the page unloads.
   * @details Adds a `beforeunload` event listener to save the current elapsed time
   *          to the backend. Cleans up the listener on component unmount.
   */
  useEffect(() => {
    function beforeUnload() {
      setTimeout(async () => {
        try {
          await postTime(elapsedTime);
        } catch (error) {
          if (error instanceof Error) {
            toast({
              variant: "destructive",
              title: "Error Occurred",
              description: error.message,
            });
          }
        }
      }, 0);
    }

    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  });

  /**
   * @brief   Handles the action of posting the elapsed time.
   * @details Attempts to send the elapsed time to the backend. If an error occurs,
   *          it displays an error message using a toast notification.
   */
  const handleClick = async () => {
    // Perform your action before navigating
    try {
      await postTime(elapsedTime);
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Error Occurred",
          description: error.message,
        });
      }
    }
  };

  /**
   * @brief   Handles the use of a hint during the game.
   * @details Checks if the game is started, and if so, fetches a hint from the server.
   *          If a hint is successfully received, it updates the game board and increases
   *          the elapsed time by 15 seconds. If the game is not started, it shows an
   *          information toast notification.
   *
   * @param   action The action to perform, typically related to getting a hint.
   */
  const handleUseHint = async (action: string) => {
    if (!gameBoard?.status.isStarted) {
      toast({
        title: "Information",
        description: "Please start the game before taking a hint.",
      });
      return;
    }

    try {
      const data = await getHint(action);
      const updatedBoard = data;
      setGameBoard(updatedBoard);
      setElapsedTime(elapsedTime + 15);
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Error Occurred",
          description: error.message,
        });
      }
    }
  };

  /**
   * @brief   Handles the submission of a new message.
   * @details Prevents submitting an empty message, sends the message to the backend,
   *          clears the message input, fetches the latest messages, and scrolls to the
   *          most recent message.
   *
   * @param   e The form submission event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (message.trim() === "") return;

    try {
      await sendMessage(message);
      setMessage("");
      handleGetMessages();
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Error Occurred",
          description: error.message,
        });
      }
    }
  };

  /**
   * @brief   Fetches and sets the latest messages.
   * @details Attempts to get the most recent messages from the backend and updates the
   *          messages state. If an error occurs, it shows a toast notification with the error.
   */
  const handleGetMessages = async () => {
    try {
      const sortedMessages = await getMessages();
      setMessages(sortedMessages);
    } catch (error) {
      if (error instanceof Error) {
        toast({
          variant: "destructive",
          title: "Error Occurred",
          description: error.message,
        });
      }
    }
  };

  /**
   * @brief   Fetches the latest messages at regular intervals.
   * @details Calls the `handleGetMessages` function on component mount and every 2 seconds
   *          thereafter to keep the messages up-to-date. Cleans up the interval when the
   *          component is unmounted.
   */
  useEffect(() => {
    handleGetMessages();
    const intervalId = setInterval(handleGetMessages, 2000);
    return () => {
      clearInterval(intervalId);
    };
  });

  /**
   * @brief   Calculates the size of the game cells based on the selected difficulty.
   * @details Returns a CSS class string that determines the size of the cells for each difficulty level.
   *
   * @param   difficulty The current difficulty level of the game.
   * @return  A string of class names for the appropriate cell size.
   */
  const getCellSize = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "w-7 h-7 sm:w-8 sm:h-8 lg:w-9 lg:h-9 2xl:w-10 2xl:h-10 xl:text-2xl";
      case "medium":
        return "w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 2xl:w-9 2xl:h-9 xl:text-2xl";
      case "hard":
        return "w-5 h-5 sm:w-6 sm:h-6 lg:w-6 lg:h-6 2xl:w-8 2xl:h-8 xl:text-2xl";
      default:
        return "w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 2xl:w-9 2xl:h-9 xl:text-2xl";
    }
  };

  // Loading Spinner
  if (isLoading) {
    return (
      <div className="w-screen h-screen grid place-content-center">
        <div
          className=" inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-danger motion-reduce:animate-[spin_1.5s_linear_infinite]"
          role="status"
        >
          <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-between gap-8 max-lg:py-12 py-6">
      {/* Main Heading */}
      <h1 className="text-center text-5xl sm:text-6xl lg:text-[68px] 2xl:text-7xl relative">
        <Link href={"/"} onClick={() => handleClick()}>
          <Button
            size={"xl"}
            variant={"secondary"}
            className="md:absolute max-lg:hidden top-5 -left-52 lg:-left-64 xl:-left-72 text-sm sm:text-md lg:text-xl 2xl:text-2xl flex items-center gap-3 group"
          >
            <span className="">Menu</span>
            <Image
              src={"/menu.png"}
              alt="Menu Icon"
              width={35}
              height={35}
              className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9 transition-transform duration-300 ease-out group-hover:scale-105"
            />
          </Button>
        </Link>
        <Link href={"/"} onClick={() => handleClick()}>
          MINESWEEPER
        </Link>
        <Button
          size={"xl"}
          variant={"secondary"}
          onClick={() => handleChangeDifficulty(difficulty)}
          className="md:absolute max-lg:hidden top-5 -right-52 lg:-right-64 xl:-right-72 text-sm sm:text-md lg:text-xl 2xl:text-2xl group"
        >
          <span> Reset </span>
          <Image
            src={"/reset.png"}
            alt="Reset Icon"
            width={36}
            height={36}
            className="w-6 h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 2xl:w-9 2xl:h-9 transition-transform duration-300 ease-out group-hover:rotate-180"
          />
        </Button>
      </h1>

      {/* Minesweeper Board */}
      <div className="flex gap-6 flex-col">
        <div className="flex max-md:flex-col gap-4 xl:gap-16">
          {(gameBoard?.status?.isLost || gameBoard?.status?.isWon) && (
            <h1
              className={`flex md:flex-col items-center justify-center gap-2 xl:gap-8 text-2xl xl:text-7xl`}
            >
              <span>Y</span>
              <span>O</span>
              <span>U</span>
            </h1>
          )}
          <div className="flex flex-col gap-[2px]">
            {gameBoard?.board.map(
              (row, rowKey) =>
                Array.isArray(row) && (
                  <div key={rowKey} className="flex gap-[2px] w-full">
                    {row.map((col, colKey) => (
                      <div
                        onClick={() =>
                          handlePerformAction(rowKey, colKey, "reveal")
                        }
                        onContextMenu={() =>
                          handlePerformAction(rowKey, colKey, "flag")
                        }
                        key={colKey}
                        className={`rounded-md grid place-content-center
                      ${!col.isRevealed && "cursor-pointer"}
                      ${getCellSize(difficulty)}
                      ${
                        col.isRevealed && col.value >= 0
                          ? "bg-[#0A0B20]"
                          : "bg-[#7CD3E7] shadow-[inset_4px_4px_1px_1.5px_#00000024]"
                      }
                      ${
                        col.isRevealed &&
                        col.value > 0 &&
                        "border max-md:border-[0.5px]"
                      }
                      ${
                        col.isHintUsed &&
                        col.value !== 0 &&
                        "border-[3px] border-[#FF5722]"
                      }
                      ${
                        col.isRevealed &&
                        gameBoard?.status?.isLost &&
                        col.value === -1 &&
                        clickedCell?.[0] === rowKey &&
                        clickedCell?.[1] === colKey &&
                        "bg-[#FF7373]"
                      }
                      ${
                        col.isFlagged &&
                        gameBoard?.status?.isLost &&
                        col.value !== -1 &&
                        "bg-[#FF7373]"
                      }
            `}
                      >
                        {gameBoard?.status?.isLost &&
                          !col.isFlagged &&
                          col.value === -1 &&
                          "💣"}
                        {col.isRevealed && col.value > 0 && col.value}
                        {col.isRevealed &&
                          col.value === -1 &&
                          !gameBoard?.status?.isLost &&
                          "💣"}
                        {col.isFlagged && "🚩"}
                      </div>
                    ))}
                  </div>
                )
            )}
          </div>
          {gameBoard?.status?.isLost && (
            <h1 className="flex md:flex-col items-center justify-center gap-2 xl:gap-8 text-2xl xl:text-7xl">
              <span>L</span>
              <span>O</span>
              <span>S</span>
              <span>T</span>
            </h1>
          )}
          {gameBoard?.status?.isWon && (
            <h1 className="flex md:flex-col items-center justify-center gap-2 xl:gap-8 text-2xl xl:text-7xl">
              <span>W</span>
              <span>O</span>
              <span>N</span>
            </h1>
          )}
        </div>

        {/* Hint Buttons */}
        <div className="flex m-auto gap-12">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="transition-transform duration-300 ease-out hover:scale-110">
                <Eye
                  className="w-8 h-8"
                  onClick={() => handleUseHint("reveal")}
                />
              </TooltipTrigger>
              <TooltipContent className="">
                <p>
                  Turn around a non-mine cell (will add +15 seconds to the
                  timer)
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="transition-transform duration-300 ease-out hover:scale-105">
                <LandPlot
                  onClick={() => handleUseHint("flag")}
                  className="w-8 h-8"
                />
              </TooltipTrigger>
              <TooltipContent className="">
                <p>Flag a mine cell (will add +15 seconds to the timer)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 w-[70%] xl:w-[60%] max-w-4xl">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="bg-white text-black px-4 sm:px-5 py-2 sm:py-3 rounded-md text-sm sm:text-md lg:text-xl 2xl:text-2xl shadow-[inset_4px_4px_1px_1.5px_#00000024]">
              Time: {formatTime(elapsedTime)}
            </TooltipTrigger>
            <TooltipContent className="text-xs sm:text-sm lg:text-lg 2xl:text-xl">
              <p>Elapsed time</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="bg-white text-black px-4 sm:px-5 py-2 sm:py-3 rounded-md text-sm sm:text-md lg:text-xl 2xl:text-2xl shadow-[inset_4px_4px_1px_1.5px_#00000024]">
              Mines Left: {gameBoard && countMinesLeft(gameBoard)}
            </TooltipTrigger>
            <TooltipContent className="text-xs sm:text-sm lg:text-lg 2xl:text-xl">
              <p>Indicates how many mines you still have left</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Select
          value={gameBoard?.difficulty}
          onValueChange={(val) => handleChangeDifficulty(val)}
        >
          <SelectTrigger className="bg-white text-black text-sm sm:text-md lg:text-xl 2xl:text-2xl py-4 sm:py-5 lg:py-6 xl:py-6 2xl:py-7 w-auto gap-9 shadow-[inset_4px_4px_1px_1.5px_#00000024]">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              value="easy"
              className="text-sm sm:text-md lg:text-xl 2xl:text-2xl"
            >
              Easy
            </SelectItem>
            <SelectItem
              value="medium"
              className="text-sm sm:text-md lg:text-xl 2xl:text-2xl"
            >
              Medium
            </SelectItem>
            <SelectItem
              value="hard"
              className="text-sm sm:text-md lg:text-xl 2xl:text-2xl"
            >
              Hard
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="max-lg:hidden absolute bottom-5 right-5">
        <Sheet>
          <SheetTrigger asChild>
            <Button className="bg-slate-200 hover:bg-slate-300 text-black sm:text-md lg:text-md 2xl:text-lg">
              Open Chat
            </Button>
          </SheetTrigger>
          <SheetContent className="text-white bg-black flex flex-col justify-between max-w-[90vw] max-h-[100vh] w-[400px]">
            <SheetHeader className="p-4">
              <SheetTitle className="text-white">
                Welcome to the game chat!
              </SheetTitle>
            </SheetHeader>

            {/* Scrollable messages */}
            <ScrollArea className="flex-1 overflow-y-auto px-4 pb-4">
              {messages && messages.length > 0 ? (
                messages.map((message) => {
                  return (
                    <div key={message.id} className="message text-muted mt-4">
                      <div>
                        <strong>{message.sender}</strong>: {message.content}
                      </div>
                      <small>
                        {message.timestamp?.seconds
                          ? new Date(
                              message.timestamp.seconds * 1000
                            ).toLocaleString()
                          : "Invalid timestamp"}
                      </small>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-muted">No messages yet.</div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Input Field */}
            <SheetFooter className="p-4">
              <form
                onSubmit={handleSubmit}
                className="flex items-center w-full gap-2"
              >
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button type="submit" className="py-4">
                  Send
                </Button>
              </form>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default GamePage;

// End of page.tsx
