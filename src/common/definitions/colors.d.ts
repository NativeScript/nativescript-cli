declare module "colors" {
	export function setTheme(theme: any): void;
	export function addSequencer(name: string, callback: Function): void;

	// none, browser, console
	export var mode: string;
}

interface String {
	// In ES6 there's a method called `bold` in String interface.
	// bold: String;
	italic: String;
	underline: String;
	inverse: String;
	white: String;
	grey: String;
	black: String;
	blue: String;
	cyan: String;
	green: String;
	magenta: String;
	red: String;
	yellow: String;
}
