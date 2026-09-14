import { IProjectConfigService, IProjectData } from "../definitions/project";
import { IFileSystem } from "../common/declarations";
import { defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import * as constants from "../constants";
import * as fontFinder from "font-finder";
import { createTable } from "../common/helpers";
import * as path from "path";

export interface IFontsCommandServices {
	$projectData: IProjectData;
	$fs: IFileSystem;
	$logger: ILogger;
	$projectConfigService: IProjectConfigService;
}

export function setupFontsCommand(): IFontsCommandServices {
	const services = {
		$projectData: inject<IProjectData>("projectData"),
		$fs: inject<IFileSystem>("fs"),
		$logger: inject<ILogger>("logger"),
		$projectConfigService: inject<IProjectConfigService>(
			"projectConfigService",
		),
	};
	services.$projectData.initializeProjectData();

	return services;
}

export const fontsCommandDefinition = defineCommand({
	name: "fonts",
	description: "Lists the custom fonts the project bundles.",
	arguments: "none",
	setup: setupFontsCommand,
	async run(context, services): Promise<void> {
		const supportedExtensions = [".ttf", ".otf"];

		const defaultFontsFolderPaths = [
			path.join(
				services.$projectConfigService.getValue("appPath") ?? "",
				constants.FONTS_DIR,
			),
			path.join(constants.APP_FOLDER_NAME, constants.FONTS_DIR),
			path.join(constants.SRC_DIR, constants.FONTS_DIR),
		].map((entry) => path.resolve(services.$projectData.projectDir, entry));

		const fontsFolderPath = defaultFontsFolderPaths.find((entry) =>
			services.$fs.exists(entry),
		);

		if (!fontsFolderPath) {
			services.$logger.warn("No fonts folder found.");
			return;
		}

		const files = services.$fs
			.readDirectory(fontsFolderPath)
			.map((entry) => path.parse(entry))
			.filter((entry) => {
				return supportedExtensions.includes(entry.ext);
			});

		if (!files.length) {
			services.$logger.warn("No custom fonts found.");
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

		services.$logger.info(table.toString());
	},
});
