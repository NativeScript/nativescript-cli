import { EOL } from "os";
import * as constants from "./constants";

export class XmlValidator implements IXmlValidator {
	constructor(private $fs: IFileSystem,
		private $logger: ILogger) { }

	public validateXmlFiles(sourceFiles: string[]): boolean {
		let xmlHasErrors = false;
		sourceFiles
			.filter(file => _.endsWith(file, constants.XML_FILE_EXTENSION))
			.forEach(file => {
				const errorOutput = this.getXmlFileErrors(file);
				const hasErrors = !!errorOutput;
				xmlHasErrors = xmlHasErrors || hasErrors;
				if (hasErrors) {
					this.$logger.info(`${file} has syntax errors.`.red.bold);
					this.$logger.info(errorOutput.yellow);
				}
			});
		return !xmlHasErrors;
	}

	public getXmlFileErrors(sourceFile: string): string {
		let errorOutput = "";
		const fileContents = this.$fs.readText(sourceFile);
		const domErrorHandler = (level: any, msg: string) => {
			errorOutput += level + EOL + msg + EOL;
		};
		this.getDomParser(domErrorHandler).parseFromString(fileContents, "text/xml");

		return errorOutput || null;
	}

	private getDomParser(errorHandler: (level: any, msg: string) => void): any {
		const DomParser = require("xmldom").DOMParser;
		const parser = new DomParser({
			locator: {},
			errorHandler: errorHandler
		});

		return parser;
	}
}
$injector.register("xmlValidator", XmlValidator);
