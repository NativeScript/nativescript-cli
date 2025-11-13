import { color, stripColors } from "../color";
import { IStaticConfig } from "../declarations";
import { injector } from "./yok";

export function printHeader() {
	if (process.env.HIDE_HEADER) return;

	const $staticConfig: IStaticConfig = injector.resolve("$staticConfig");
	const version = $staticConfig.version;

	const header = [
		color.dim("│ "),
		color.styleText(["cyanBright", "bold"], "{N} NativeScript "),
		color.styleText(["whiteBright", "bold"], "CLI"),
		color.dim(` [v${version}] `),
		// color.dim("  │"),
	].join("");
	const tagLine = [
		color.dim("│ "),
		color.dim(" → "),
		color.styleText(
			["whiteBright", "bold"],
			"Empower JavaScript with native APIs ",
		),
		// color.dim("  │"),
	].join("");

	const headerLength = stripColors(header).length;
	const tagLineLength = stripColors(tagLine).length;
	const width = Math.max(headerLength, tagLineLength);

	console.info("  " + color.dim("┌" + "─".repeat(width - 1) + "┐"));
	console.info(
		"  " + header + " ".repeat(width - headerLength) + color.dim("│"),
	);
	console.info(
		"  " + tagLine + " ".repeat(width - tagLineLength) + color.dim("│"),
	);
	console.info("  " + color.dim("└" + "─".repeat(width - 1) + "┘"));
}
