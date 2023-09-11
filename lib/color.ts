// using chalk as some of our other dependencies are already using it...
// exporting from here so we can easily refactor to a different color library if needed
import * as chalk from "chalk";

export type Color = typeof chalk.Color;

export const color = chalk;
