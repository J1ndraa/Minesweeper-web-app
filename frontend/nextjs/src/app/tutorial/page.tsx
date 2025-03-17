/**
 * @file    page.tsx
 * @author  Marek Čupr
 * @date    2024-11-12
 *
 * @brief   Tutorial page for the Minesweeper game application. This page provides users with
 *          an interactive tutorial using a carousel of images and navigation buttons.
 *
 * @details This component serves as the tutorial page for the Minesweeper game application.
 *          It includes a carousel that displays images with step-by-step instructions on how
 *          to play the game. The page also provides a navigation button that allows users to
 *          return to the main menu.
 */

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import Link from "next/link";

const TutorialPage = () => {
  return (
    <div className="bg-[#7CD3E7] h-screen p-4 flex flex-col gap-10 items-center">
      {/* Navigation Section */}
      <h1 className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-5xl 2xl:text-7xl relative">
        <Link href={"/"}>
          <Button
            size={"xl"}
            variant={"secondary"}
            className="absolute max-lg:hidden top-5 -left-52 lg:-left-64 xl:-left-72 text-sm sm:text-md lg:text-xl 2xl:text-2xl flex items-center gap-3 shadow-[inset_4px_4px_1px_1.5px_#00000024]"
          >
            <span className="">End</span>
          </Button>
        </Link>
        <Link href={"/"}>
          MINESWEEPER
          <br />
          TUTORIAL
        </Link>
        <></>
      </h1>

      {/* Carousel Section */}
      <Carousel className="md:w-9/12  px-10 max-w-3xl">
        <CarouselContent>
          {/* Carousel Item 1 */}
          <CarouselItem>
            <Image
              src={"/tutorial-1.png"}
              alt="Tutorial 1"
              width={1022}
              height={720}
              className="w-full object-contain"
            />
          </CarouselItem>

          {/* Carousel Item 2 */}
          <CarouselItem>
            <Image
              src={"/tutorial-2.png"}
              alt="Tutorial 2"
              width={1022}
              height={720}
              className="w-full object-contain"
            />
          </CarouselItem>

          {/* Carousel Item 3 */}
          <CarouselItem>
            <Image
              src={"/tutorial-3.png"}
              alt="Tutorial 3"
              width={1022}
              height={720}
              className="w-full object-contain"
            />
          </CarouselItem>

          {/* Carousel Item 4 */}
          <CarouselItem>
            <Image
              src={"/tutorial-4.png"}
              alt="Tutorial 4"
              width={1022}
              height={720}
              className="w-full object-contain"
            />
          </CarouselItem>

          {/* Carousel Item 5 */}
          <CarouselItem>
            <Image
              src={"/tutorial-5.png"}
              alt="Tutorial 5"
              width={1022}
              height={720}
              className="w-full object-contain"
            />
          </CarouselItem>

          {/* Carousel Item 6 */}
          <CarouselItem>
            <Image
              src={"/tutorial-6.png"}
              alt="Tutorial 6"
              width={1022}
              height={720}
              className="w-full object-contain"
            />
          </CarouselItem>

          {/* Carousel Item 7 */}
          <CarouselItem>
            <Image
              src={"/tutorial-7.png"}
              alt="Tutorial 7"
              width={1022}
              height={720}
              className="w-full object-contain"
            />
          </CarouselItem>
        </CarouselContent>

        {/* Carousel Navigation Buttons */}
        <CarouselPrevious className="bg-[#000000] border-none text-white max-md:absolute max-md:left-10 max-md:top-[110%] w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 2xl:w-14 2xl:h-14" />
        <CarouselNext className="bg-[#000000] border-none text-white max-md:absolute max-md:right-10 max-md:top-[110%] w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 2xl:w-14 2xl:h-14" />
      </Carousel>
    </div>
  );
};

export default TutorialPage;

// End of page.tsx
