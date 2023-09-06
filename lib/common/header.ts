import { color, stripColors } from "../color";

export function printHeader() {
	if (process.env.HIDE_HEADER) return;
	const version = "8.5.3";
	const middle = [
		color.dim("│  "),
		color.cyanBright.bold(" {N} NativeScript "),
		color.whiteBright.bold("CLI"),
		color.dim(` [v${version}] `),
		color.dim("  │"),
	].join("");
	const middle2 = [
		color.dim("│ "),
		color.whiteBright.bold(" Empower JavaScript with native APIs "),
		color.dim("  │"),
	].join("");

	const end = [color.dim("─┘")].join("");

	const width = stripColors(middle).length;
	const endWidth = stripColors(end).length;
	console.info(" ");
	console.info("  " + color.dim("┌" + "─".repeat(width - 2) + "┐"));
	console.info("  " + middle);
	console.info("  " + middle2);
	console.info("  " + color.dim("└" + "─".repeat(width - endWidth - 1)) + end);
}
