// using chalk as some of our other dependencies are already using it...
// exporting from here so we can easily refactor to a different color library if needed
import * as ansi from "ansi-colors";
import * as chalk from "chalk";

export type Color = typeof chalk.Color;

export function stripColors(formatStr: string) {
	return ansi.stripColor(formatStr);
}

export const color = chalk;
