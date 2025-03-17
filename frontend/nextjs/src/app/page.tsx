/**
 * @file    page.tsx
 * @author  Marek Čupr
 * @date    2024-11-12
 *
 * @brief   Home page for the Minesweeper game. This page allows the user to enter a nickname,
 *          start the game, view the leaderboard, or access the tutorial.
 *
 * @details This component manages the main menu for the Minesweeper game. It includes input validation
 *          for the nickname, communication with the backend to fetch and save user data, and provides
 *          navigation options to different parts of the game. It also handles loading states and errors
 *          gracefully.
 */

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/useToast";
import { createUser } from "@/services/user/createUser";
import { getUser } from "@/services/user/getUser";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  // Nickname input value
  const [nickname, setNickname] = useState("");
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  // Nickname validity
  const [isValidNickname, setIsValidNickname] = useState(false);
  // Show error if the nickname is invalid and not empty
  const showError = !isValidNickname && nickname.length > 0;
  // Router for navigation (from NextJS)
  const router = useRouter();

  /**
   * @brief   Handles the nickname change event.
   * @details This function updates the nickname state and validates
   *          it to be between 4 and 15 characters long.
   */
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get the new nickname from the input
    const newNickname = e.target.value;
    setNickname(newNickname);

    // Validate the nickname to ensure it's between 4 and 15 characters long
    if (newNickname.trim().length > 3 && newNickname.trim().length < 16) {
      setIsValidNickname(true);
    } else {
      setIsValidNickname(false);
    }
  };

  /**
   * @brief   Fetches the current user's nickname.
   * @details This function attempts to retrieve the nickname of the current user.
   */
  const handleGetUser = async () => {
    setIsLoading(true);
    try {
      // Attempt to fetch the current user's nickname from the backend
      const nickname = await getUser();
      setNickname(nickname);
      setIsValidNickname(true);
    } catch (error: unknown) {
      // Handle errors if fetching the nickname fails
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

  // Fetch the user nickname once the page is loaded
  useEffect(() => {
    handleGetUser();
  }, []);

  /**
   * @brief   Handles the click event to start the game.
   * @details This function checks if the nickname is valid. Once valid,
   *          it redirects the user to the game.
   */
  const handlePlayClick = async () => {
    // Check if the nickname is valid
    if (isValidNickname) {
      try {
        await createUser(nickname);
        router.push("/game");
      } catch (error: unknown) {
        // Handle errors if fetching the nickname fails
        if (error instanceof Error) {
          toast({
            variant: "destructive",
            title: "Error Occurred",
            description: error.message,
          });
        }
      }
    }
  };

  /**
   * @brief   Main menu of the Minesweeper game.
   * @details This component renders the game title, a nickname input field,
   *          and navigation buttons for starting the game, viewing the leaderboard,
   *          and accessing the tutorial.
   */
  return (
    <main className="h-screen bg-[url('/background.png')] bg-cover bg-no-repeat bg-left md:bg-center">
      {isLoading ? (
        // Loading Spinner
        <div className="grid h-full place-content-center p-10">
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
        // Main Content
        <div className="h-full grid place-content-center py-28 xl:py-32 gap-10 md:gap-11 xl:gap-[46px] 2xl:gap-12">
          <h1 className="text-center text-5xl md:text-6xl xl:text-7xl 2xl:text-[84px]">
            <Link href={"/"}>MINESWEEPER</Link>
          </h1>

          {/* User Input and Navigation Buttons */}
          <div className="grid justify-center gap-8 xl:gap-9 2xl:gap-10">
            {/* User Input Section */}
            <div className="relative text-center flex flex-col items-center gap-3 md:gap-4 xl:gap-5 2xl:gap-7">
              <Label>
                <span className="text-2xl md:text-3xl xl:text-4xl 2xl:text-[42px]">
                  Enter your nickname:
                </span>
              </Label>
              <div className="relative flex flex-col items-center">
                <Input
                  maxLength={15}
                  minLength={4}
                  placeholder="nickname"
                  type="text"
                  className={`relative max-w-[70%] bg-white text-black text-md md:text-lg xl:text-xl 2xl:text-2xl py-[17.5px] md:py-5 xl:py-[23px] 2xl:py-[26px] border-2 xl:border-[3px] rounded-lg 2xl:rounded-xl ${
                    showError ? "border-red-500" : "border-transparent"
                  }`}
                  value={nickname}
                  onChange={handleNicknameChange}
                />
              </div>
              {/* Show error if nickname validation fails */}
              {showError && (
                <p className="absolute -bottom-5 md:-bottom-[22px] xl:-bottom-6 text-[11.5px] md:text-[13.1px] xl:text-[15.1px] text-red-500">
                  Nickname must be between 4 and 15 characters.
                </p>
              )}
            </div>

            {/* Navigation Buttons Section */}
            <div className="flex flex-col items-center justify-center gap-8 md:gap-10 xl:gap-11 2xl:gap-12">
              {/* Play Button */}
              <Button
                variant={"secondary"}
                size={"xl"}
                asChild
                className="text-md md:text-lg xl:text-xl py-2 md:py-[9px] xl:py-[11px] 2xl:py-[13px] xl:px-6 2xl:px-7 rounded-lg xl:rounded-xl cursor-pointer"
                onClick={handlePlayClick}
              >
                <span>Play</span>
              </Button>

              {/* Tutorial Button */}
              <Button
                variant={"secondary"}
                size={"xl"}
                asChild
                className="text-md md:text-lg xl:text-xl py-2 md:py-[9px] xl:py-[11px] 2xl:py-[13px] xl:px-6 2xl:px-7 rounded-lg xl:rounded-xl"
              >
                <Link href={"/tutorial"}>How to play</Link>
              </Button>

              {/* Leaderboard Button */}
              <Button
                variant={"secondary"}
                size={"xl"}
                asChild
                className="text-md md:text-lg xl:text-xl py-2 md:py-[9px] xl:py-[11px] 2xl:py-[13px] xl:px-6 2xl:px-7 rounded-lg xl:rounded-xl"
              >
                <Link href={"/leaderboard"} className="relative">
                  <span>Leaderboard</span>
                  {/* Crown Icon */}
                  <Image
                    src={"/crown.png"}
                    width={30}
                    height={30}
                    alt="Crown Icon"
                    className="absolute -top-4 -right-2 md:-top-5 md:-right-3 xl:-top-5 xl:-right-3 w-8 h-8 md:w-9 md:h-9 xl:w-10 xl:h-10 2xl:w-11 2xl:h-11"
                  />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// End of page.tsx
