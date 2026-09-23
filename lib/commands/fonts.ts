import { IProjectConfigService } from "../definitions/project";
import { IFileSystem } from "../common/declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import * as constants from "../constants";
import * as fontFinder from "font-finder";
import { createTable } from "../common/helpers";
import * as path from "path";
import { ProjectData } from "../contracts/project-data";
import { provideProject } from "./command-base";

export const fontsCommandDefinition = defineCommand({
	name: "fonts",
	description: "Lists the custom fonts the project bundles.",
	arguments: "none",
	providers: [provideProject()],
	async run(): Promise<void> {
		const $projectData = inject(ProjectData);
		const $fs = inject<IFileSystem>("fs");
		const $logger = inject<ILogger>("logger");
		const $projectConfigService = inject<IProjectConfigService>(
			"projectConfigService",
		);
		const supportedExtensions = [".ttf", ".otf"];

		const defaultFontsFolderPaths = [
			path.join(
				$projectConfigService.getValue("appPath") ?? "",
				constants.FONTS_DIR,
			),
			path.join(constants.APP_FOLDER_NAME, constants.FONTS_DIR),
			path.join(constants.SRC_DIR, constants.FONTS_DIR),
		].map((entry) => path.resolve($projectData.projectDir, entry));

		const fontsFolderPath = defaultFontsFolderPaths.find((entry) =>
			$fs.exists(entry),
		);

		if (!fontsFolderPath) {
			$logger.warn("No fonts folder found.");
			return;
		}

		const files = $fs
			.readDirectory(fontsFolderPath)
			.map((entry) => path.parse(entry))
			.filter((entry) => {
				return supportedExtensions.includes(entry.ext);
			});

		if (!files.length) {
			$logger.warn("No custom fonts found.");
			return;
		}

		const table: any = createTable(["Font", "CSS Properties"], []);

		for (const file of files) {
			const font = await fontFinder.get(fontsFolderPath + "/" + file.base);
			table.push([
				file.base,
				`font-family: "${font.name}", "${file.name}"; font-weight: ${font.weight};`,
			]);
		}

		$logger.info(table.toString());
	},
});
