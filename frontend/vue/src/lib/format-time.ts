/*
 * @file: format-time.ts
 * @author: Halva Jindřich (xhalva05)
 * @name: GUI Project for University subject ITU (FIT VUT v Brně)
 * @brief: /import this file for time formatting, inspired by the code of my project colegue - (xcuprm01) Čupr Marek
 * @date: December 2024
 */

//time format example: 1:31s
export const format_time = (seconds: number): string => {
  const min = Math.floor(seconds/60);
  const sec = seconds%60;
  return `${min}:${(sec < 10) ? "0" : ""}${sec}s`;
};
