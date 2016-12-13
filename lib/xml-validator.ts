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
				let errorOutput = this.getXmlFileErrors(file);
				let hasErrors = !!errorOutput;
				xmlHasErrors = xmlHasErrors || hasErrors;
				if (hasErrors) {
					this.$logger.info(`${file} has syntax errors.`.red.bold);
					this.$logger.out(errorOutput.yellow);
				}
			});
		return !xmlHasErrors;
	}

	public getXmlFileErrors(sourceFile: string): string {
		let errorOutput = "";
		let fileContents = this.$fs.readText(sourceFile);
		let domErrorHandler = (level:any, msg:string) => {
			errorOutput += level + EOL + msg + EOL;
		};
		this.getDomParser(domErrorHandler).parseFromString(fileContents, "text/xml");

		return errorOutput || null;
	}

	private getDomParser(errorHandler: (level:any, msg:string) => void): any {
		let DomParser = require("xmldom").DOMParser;
		let parser = new DomParser({
			locator:{},
			errorHandler: errorHandler
		});

		return parser;
	}
}
$injector.register("xmlValidator", XmlValidator);
