import * as path from "path";
import { EOL } from "os";
import marked = require("marked");
import { CommandsDelimiters } from "../constants";

interface IHtmlPageGenerationData {
	basicHtmlPage: string;
	pathToMdFile: string;
	pathToMdPages: string;
	pathToHtmlPages: string;
	extensionName?: string;
}

export class HelpService implements IHelpService {
	private static MARKDOWN_FILE_EXTENSION = ".md";
	private static HTML_FILE_EXTENSION = ".html";
	private static MAN_PAGE_NAME_REGEX = /@MAN_PAGE_NAME@/g;
	private static HTML_COMMAND_HELP_REGEX = /@HTML_COMMAND_HELP@/g;
	private static RELATIVE_PATH_TO_STYLES_CSS_REGEX = /@RELATIVE_PATH_TO_STYLES_CSS@/g;
	private static RELATIVE_PATH_TO_IMAGES_REGEX = /@RELATIVE_PATH_TO_IMAGES@/g;
	private static RELATIVE_PATH_TO_INDEX_REGEX = /@RELATIVE_PATH_TO_INDEX@/g;
	private static EXTENSION_NAME_REGEX = /@EXTENSION_NAME@/g;
	private static MARKDOWN_LINK_REGEX = /\[([\w \-\`\<\>\*\:\\]+?)\]\([\s\S]+?\)/g;
	private static SPAN_REGEX = /([\s\S]*?)(?:\r?\n)?<span.*?>([\s\S]*?)<\/span>(?:\r?\n)*/g;
	private static NEW_LINE_REGEX = /<\/?\s*?br\s*?\/?>/g; // <br>, <br > <br/> <br />
	private get newLineRegex(): RegExp {
		return /\r?\n/g;
	}

	private pathToManPages: string;
	private pathToHtmlPages: string;
	private get pathToStylesCss(): string {
		return path.join(this.$staticConfig.HTML_COMMON_HELPERS_DIR, "styles.css");
	}

	private get pathToBasicPage(): string {
		return path.join(this.$staticConfig.HTML_COMMON_HELPERS_DIR, "basic-page.html");
	}

	private get pathToBasicPageForExtensions(): string {
		return path.join(this.$staticConfig.HTML_COMMON_HELPERS_DIR, "basic-extensions-page.html");
	}

	private pathToImages = this.$staticConfig.HTML_CLI_HELPERS_DIR;
	private get pathToIndexHtml(): string {
		return path.join(this.$staticConfig.HTML_PAGES_DIR, "index.html");
	}

	constructor(private $logger: ILogger,
		private $injector: IInjector,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $staticConfig: Config.IStaticConfig,
		private $extensibilityService: IExtensibilityService,
		private $microTemplateService: IMicroTemplateService,
		private $opener: IOpener) {
		this.pathToHtmlPages = this.$staticConfig.HTML_PAGES_DIR;
		this.pathToManPages = this.$staticConfig.MAN_PAGES_DIR;
	}

	public async openHelpForCommandInBrowser(commandData: ICommandData): Promise<void> {
		const { commandName } = commandData;
		const htmlPage = await this.convertCommandNameToFileName(commandData) + HelpService.HTML_FILE_EXTENSION;
		this.$logger.trace("Opening help for command '%s'. FileName is '%s'.", commandName, htmlPage);

		this.$fs.ensureDirectoryExists(this.pathToHtmlPages);
		if (!this.tryOpeningSelectedPage(htmlPage)) {
			// HTML pages may have been skipped on post-install, lets generate them.
			this.$logger.trace("Required HTML file '%s' is missing. Let's try generating HTML files and see if we'll find it.", htmlPage);
			await this.generateHtmlPages();
			if (!this.tryOpeningSelectedPage(htmlPage)) {
				this.$errors.failWithoutHelp("Unable to find help for '%s'", commandName);
			}
		}
	}

	public async generateHtmlPages(): Promise<void> {
		const mdFiles = this.$fs.enumerateFilesInDirectorySync(this.pathToManPages);
		const basicHtmlPage = this.$fs.readText(this.pathToBasicPage);
		await Promise.all(_.map(mdFiles, markdownFile => {
			const htmlPageGenerationData: IHtmlPageGenerationData = {
				basicHtmlPage,
				pathToMdFile: markdownFile,
				pathToMdPages: this.pathToManPages,
				pathToHtmlPages: this.pathToHtmlPages
			};

			return this.createHtmlPage(htmlPageGenerationData);
		}));

		const installedExtensionsData = this.$extensibilityService.getInstalledExtensionsData();

		const basicHtmlPageForExtensions = this.$fs.readText(this.pathToBasicPageForExtensions);
		for (const extensionData of installedExtensionsData) {
			const docsDir = extensionData.docs;

			if (docsDir) {
				this.$logger.trace(`Start generation of html help content for extension ${extensionData.extensionName}`);
				if (!this.$fs.exists(docsDir)) {
					this.$logger.warn(`Unable to generate html help pages for extension ${extensionData.extensionName} as the docs directory ${docsDir} does not exist.`);
					continue;
				}

				const htmlDirFullPath = HelpService.getHtmlDirFullPath(docsDir);
				this.$fs.ensureDirectoryExists(htmlDirFullPath);
				const extensionMdFiles = this.$fs.enumerateFilesInDirectorySync(docsDir);
				try {
					await Promise.all(_.map(extensionMdFiles, markdownFile => {
						const htmlPageGenerationData: IHtmlPageGenerationData = {
							basicHtmlPage: basicHtmlPageForExtensions,
							pathToMdFile: markdownFile,
							pathToMdPages: docsDir,
							pathToHtmlPages: htmlDirFullPath,
							extensionName: extensionData.extensionName
						};

						return this.createHtmlPage(htmlPageGenerationData);
					}));
				} catch (err) {
					this.$logger.warn(`Unable to generate html help for extension ${extensionData.extensionName}. Error is: ${err.message}`);
				}

				this.$logger.trace(`Finished generation of html help content for extension ${extensionData.extensionName}`);
			}
		}

		this.$logger.trace("Finished generating HTML files.");
	}

	public async showCommandLineHelp(commandData: ICommandData): Promise<void> {
		const help = await this.getCommandLineHelpForCommand(commandData);
		if (this.$staticConfig.FULL_CLIENT_NAME) {
			this.$logger.info(this.$staticConfig.FULL_CLIENT_NAME.green.bold + EOL);
		}

		this.$logger.printMarkdown(help);
	}

	/**
	 * Gets the help content for a specific command that should be shown on the terminal.
	 * @param {string} commandName Name of the command for which to read the help.
	 * @returns {Promise<string>} Help content of the command parsed with all terminal rules applied (stripped content that should be shown only for html help).
	 */
	private async getCommandLineHelpForCommand(commandData: ICommandData): Promise<string> {
		const helpText = await this.readMdFileForCommand(commandData);
		const commandLineHelp = (await this.$microTemplateService.parseContent(helpText, { isHtml: false }))
			.replace(/&nbsp;/g, " ")
			.replace(HelpService.MARKDOWN_LINK_REGEX, "$1")
			.replace(HelpService.SPAN_REGEX, (matchingSubstring: string, textBeforeSpan: string, textInsideSpan: string, index: number, fullString: string): string => {
				return textBeforeSpan + textInsideSpan.replace(this.newLineRegex, "");
			})
			.replace(HelpService.NEW_LINE_REGEX, EOL);

		return commandLineHelp;
	}

	// This method should return Promise in order to generate all html pages simultaneously.
	private async createHtmlPage(htmlPageGenerationData: IHtmlPageGenerationData): Promise<void> {
		const { basicHtmlPage, pathToMdFile, pathToMdPages, pathToHtmlPages, extensionName } = htmlPageGenerationData;
		const mdFileName = path.basename(pathToMdFile);
		const htmlFileName = mdFileName.replace(HelpService.MARKDOWN_FILE_EXTENSION, HelpService.HTML_FILE_EXTENSION);
		this.$logger.trace("Generating '%s' help topic.", htmlFileName);

		const helpText = this.$fs.readText(pathToMdFile);
		const outputText = await this.$microTemplateService.parseContent(helpText, { isHtml: true });
		const htmlText = marked(outputText);

		const filePath = pathToMdFile
			.replace(path.basename(pathToMdPages), path.basename(pathToHtmlPages))
			.replace(mdFileName, htmlFileName);
		this.$logger.trace("HTML file path for '%s' man page is: '%s'.", mdFileName, filePath);

		let outputHtml = basicHtmlPage
			.replace(HelpService.MAN_PAGE_NAME_REGEX, mdFileName.replace(HelpService.MARKDOWN_FILE_EXTENSION, ""))
			.replace(HelpService.HTML_COMMAND_HELP_REGEX, htmlText)
			.replace(HelpService.RELATIVE_PATH_TO_STYLES_CSS_REGEX, path.relative(path.dirname(filePath), this.pathToStylesCss))
			.replace(HelpService.RELATIVE_PATH_TO_IMAGES_REGEX, path.relative(path.dirname(filePath), this.pathToImages))
			.replace(HelpService.RELATIVE_PATH_TO_INDEX_REGEX, path.relative(path.dirname(filePath), this.pathToIndexHtml));

		if (extensionName) {
			outputHtml = outputHtml.replace(HelpService.EXTENSION_NAME_REGEX, extensionName);
		}

		this.$fs.writeFile(filePath, outputHtml);
		this.$logger.trace("Finished writing file '%s'.", filePath);
	}

	private async convertCommandNameToFileName(commandData: ICommandData): Promise<string> {
		let { commandName } = commandData;
		const defaultCommandMatch = commandName && commandName.match(/(\w+?)\|\*/);
		if (defaultCommandMatch) {
			this.$logger.trace("Default command found. Replace current command name '%s' with '%s'.", commandName, defaultCommandMatch[1]);
			commandName = defaultCommandMatch[1];
		}

		const availableCommands = this.$injector.getRegisteredCommandsNames(true).sort();
		this.$logger.trace("List of registered commands: %s", availableCommands.join(", "));
		if (commandName && !_.includes(availableCommands, commandName)) {
			await this.throwMissingCommandError(commandData);
		}

		return (commandName && commandName.replace(/\|/g, "-")) || "index";
	}

	private async throwMissingCommandError(commandData: ICommandData): Promise<void> {
		const commandName = commandData.commandName;
		const commandInfo = {
			inputStrings: [commandName, ...commandData.commandArguments],
			commandDelimiter: CommandsDelimiters.HierarchicalCommand,
			defaultCommandDelimiter: CommandsDelimiters.DefaultHierarchicalCommand
		};

		const extensionData = await this.$extensibilityService.getExtensionNameWhereCommandIsRegistered(commandInfo);
		if (extensionData) {
			this.$errors.failWithoutHelp(extensionData.installationMessage);
		}

		this.$errors.failWithoutHelp("Unknown command '%s'. Try '$ %s help' for a full list of supported commands.", commandName, this.$staticConfig.CLIENT_NAME.toLowerCase());
	}
	private static getHtmlDirFullPath(docsDir: string): string {
		return path.join(path.dirname(docsDir), "html");
	}

	private getHelpFile(searchedFileName: string, dirToCheck: string, getFullPathAction?: (docsDir: string) => string): string {
		const fileList = this.$fs.enumerateFilesInDirectorySync(dirToCheck);
		let fileToOpen = _.find(fileList, file => path.basename(file) === searchedFileName);
		if (!fileToOpen) {
			fileToOpen = this.getHelpFileFromExtensions(searchedFileName, getFullPathAction);
		}

		return fileToOpen;
	}

	private getHelpFileFromExtensions(searchedFileName: string, getFullPathAction?: (docsDir: string) => string): string {
		const installedExtensionsData = this.$extensibilityService.getInstalledExtensionsData();

		for (const extensionData of installedExtensionsData) {
			const docsDir = extensionData.docs;
			if (docsDir) {
				const fullPath = getFullPathAction ? getFullPathAction(docsDir) : docsDir;
				const fileToOpen = this.$fs.exists(fullPath) && _.find(this.$fs.enumerateFilesInDirectorySync(fullPath), file => path.basename(file) === searchedFileName);
				if (fileToOpen) {
					return fileToOpen;
				}
			}
		}
	}

	private tryOpeningSelectedPage(htmlPage: string): boolean {
		const pageToOpen = this.getHelpFile(htmlPage, this.pathToHtmlPages, HelpService.getHtmlDirFullPath);

		if (pageToOpen) {
			this.$logger.trace("Found page to open: '%s'", pageToOpen);
			this.$opener.open(pageToOpen);
			return true;
		}

		this.$logger.trace("Unable to find file: '%s'", htmlPage);
		return false;
	}

	private async readMdFileForCommand(commandData: ICommandData): Promise<string> {
		const mdFileName = await this.convertCommandNameToFileName(commandData) + HelpService.MARKDOWN_FILE_EXTENSION;
		this.$logger.trace("Reading help for command '%s'. FileName is '%s'.", commandData.commandName, mdFileName);

		const markdownFile = this.getHelpFile(mdFileName, this.pathToManPages);

		if (markdownFile) {
			return this.$fs.readText(markdownFile);
		}

		await this.throwMissingCommandError(commandData);
	}
}

$injector.register("helpService", HelpService);
