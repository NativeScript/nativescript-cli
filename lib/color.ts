import { styleText, stripVTControlCharacters } from "node:util";

// Define color types based on util.inspect.colors
export type StyleFormat =
	| "reset"
	| "bold"
	| "dim"
	| "italic"
	| "underline"
	| "blink"
	| "inverse"
	| "hidden"
	| "strikethrough"
	| "doubleunderline"
	| "black"
	| "red"
	| "green"
	| "yellow"
	| "blue"
	| "magenta"
	| "cyan"
	| "white"
	| "gray"
	| "redBright"
	| "greenBright"
	| "yellowBright"
	| "blueBright"
	| "magentaBright"
	| "cyanBright"
	| "whiteBright"
	| "bgBlack"
	| "bgRed"
	| "bgGreen"
	| "bgYellow"
	| "bgBlue"
	| "bgMagenta"
	| "bgCyan"
	| "bgWhite"
	| "bgGray"
	| "bgRedBright"
	| "bgGreenBright"
	| "bgYellowBright"
	| "bgBlueBright"
	| "bgMagentaBright"
	| "bgCyanBright"
	| "bgWhiteBright";

export type Color = StyleFormat;

// Create a chalk-like API using the Node.js util.styleText function
export const color = {
	reset: (text: string) => styleText("reset", text),
	bold: (text: string) => styleText("bold", text),
	dim: (text: string) => styleText("dim", text),
	italic: (text: string) => styleText("italic", text),
	underline: (text: string) => styleText("underline", text),
	inverse: (text: string) => styleText("inverse", text),
	hidden: (text: string) => styleText("hidden", text),
	strikethrough: (text: string) => styleText("strikethrough", text),

	// Text colors
	black: (text: string) => styleText("black", text),
	red: (text: string) => styleText("red", text),
	blue: (text: string) => styleText("blue", text),
	magenta: (text: string) => styleText("magenta", text),
	cyan: (text: string) => styleText("cyan", text),
	white: (text: string) => styleText("white", text),
	gray: (text: string) => styleText("gray", text),
	yellow: (text: string) => styleText("yellow", text),
	green: (text: string) => styleText("green", text),
	grey: (text: string) => styleText("grey", text),

	// Background colors
	bgBlack: (text: string) => styleText("bgBlack", text),
	bgBlackBright: (text: string) => styleText("bgBlackBright", text),
	bgRed: (text: string) => styleText("bgRed", text),
	bgGreen: (text: string) => styleText("bgGreen", text),
	bgYellow: (text: string) => styleText("bgYellow", text),
	bgBlue: (text: string) => styleText("bgBlue", text),
	bgMagenta: (text: string) => styleText("bgMagenta", text),
	bgCyan: (text: string) => styleText("bgCyan", text),
	bgWhite: (text: string) => styleText("bgWhite", text),
	cyanBright: (text: string) => styleText("cyanBright", text),
	whiteBright: (text: string) => styleText("whiteBright", text),
	greenBright: (text: string) => styleText("greenBright", text),
	yellowBright: (text: string) => styleText("yellowBright", text),
	redBright: (text: string) => styleText("redBright", text),

	styleText,
};

export const stripColors = (text: string) => stripVTControlCharacters(text);
