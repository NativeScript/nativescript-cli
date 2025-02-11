import { IProjectConfigService, IProjectData } from "../definitions/project";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { injector } from "../common/yok";
import { IFileSystem } from "../common/declarations";
import * as constants from "../constants";
import * as fontFinder from "font-finder";
import { createTable } from "../common/helpers";
import * as path from "path";

export class FontsCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $projectData: IProjectData,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $projectConfigService: IProjectConfigService
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		const supportedExtensions = [".ttf", ".otf"];

		const defaultFontsFolderPaths = [
			path.join(
				this.$projectConfigService.getValue("appPath") ?? "",
				constants.FONTS_DIR
			),
			path.join(constants.APP_FOLDER_NAME, constants.FONTS_DIR),
			path.join(constants.SRC_DIR, constants.FONTS_DIR)
		].map((entry) => path.resolve(this.$projectData.projectDir, entry));

		const fontsFolderPath = defaultFontsFolderPaths.find((entry) =>
			this.$fs.exists(entry)
		);

		if (!fontsFolderPath) {
			this.$logger.warn("No fonts folder found.");
			return;
		}

		const files = this.$fs
			.readDirectory(fontsFolderPath)
			.map((entry) => path.parse(entry))
			.filter((entry) => {
				return supportedExtensions.includes(entry.ext);
			});

		if (!files.length) {
			this.$logger.warn("No custom fonts found.");
			return;
		}

		const table: any = createTable(["Font", "CSS Properties"], []);

		for (const file of files) {
			const font = await fontFinder.get(fontsFolderPath + "/" + file.base);
			table.push([
				file.base,
				`font-family: "${font.name}", "${file.name}"; font-weight: ${font.weight};`
			]);
		}

		this.$logger.info(table.toString());
	}
}

injector.registerCommand("fonts", FontsCommand);
