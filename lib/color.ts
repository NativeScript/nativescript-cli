// using chalk as some of our other dependencies are already using it...
// exporting from here so we can easily refactor to a different color library if needed
import * as ansi from "ansi-colors";
import { ColorName, Chalk } from "chalk";

export type Color = ColorName;

export function stripColors(formatStr: string) {
	return ansi.stripColor(formatStr);
}

export const color = new Chalk();
