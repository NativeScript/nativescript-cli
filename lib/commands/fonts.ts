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
			path.join(constants.SRC_DIR, constants.FONTS_DIR),
		].map((entry) => path.resolve(this.$projectData.projectDir, entry));

		const fontsFolderPath = defaultFontsFolderPaths.find((entry) =>
			this.$fs.exists(entry)
		);

		const table: any = createTable(["Font", "CSS Properties"], []);

		for (const entry of this.$fs.readDirectory(fontsFolderPath)) {
			const file = path.parse(entry);

			if (!supportedExtensions.includes(file.ext)) {
				continue;
			}

			const font = await fontFinder.get(fontsFolderPath + "/" + entry);
			table.push([
				entry,
				`font-family: "${font.name}", "${file.name}"; font-weight: ${font.weight};`,
			]);
		}

		this.$logger.info(table.toString());
	}
}

injector.registerCommand("fonts", FontsCommand);
