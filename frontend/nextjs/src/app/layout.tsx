/**
 * @file    layout.tsx
 * @author  Marek Čupr
 * @date    2024-11-12
 *
 * @brief   Layout component for the Minesweeper game application. It sets up the overall page
 *          structure, including font styling, metadata, and global styling.
 *
 * @details This component serves as the root layout for the Minesweeper game application. It
 *          applies global styles, integrates the "Itim" font, and includes a toaster for
 *          notifications. Additionally, it defines the metadata for the page, including the title,
 *          description, and icon. This layout wraps the entire content of the app.
 */

import type { Metadata } from "next";
import { Itim } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// Import the 'Itim' font from Google Fonts
const itim = Itim({
  weight: ["400"],
  subsets: ["latin"],
  style: ["normal"],
});

// Configure the metadata
export const metadata: Metadata = {
  title: "MINESWEEPER",
  description: "A minesweeper game",
  icons: {
    icon: "/icon.png",
  },
};

// Wrap the entire content of the app
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${itim.className} antialiased bg-[#0A0B20] text-white h-screen`}
      >
        {/* Toaster for displaying notifications */}
        <Toaster />
        {/* Render child components */}
        {children}
      </body>
    </html>
  );
}

// End of layout.tsx
