///<reference path=".d.ts"/>
"use strict";

import { EOL } from "os";

export class XmlValidator implements IXmlValidator {
	constructor(private $fs: IFileSystem,
				private $logger: ILogger) { }

	public validateXmlFiles(sourceFiles: string[]): IFuture<boolean> {
		return (() => {
			let xmlHasErrors = false;
			sourceFiles
				.filter(file => _.endsWith(file, ".xml"))
				.forEach(file => {
					let errorOutput = this.getXmlFileErrors(file).wait();
					let hasErrors = !!errorOutput;
					xmlHasErrors = xmlHasErrors || hasErrors;
					if (hasErrors) {
						this.$logger.warn(`${file} has syntax errors.`);
						this.$logger.out(errorOutput);
					}
				});
			return !xmlHasErrors;
		}).future<boolean>()();
	}

	public getXmlFileErrors(sourceFile: string): IFuture<string> {
		return ((): string => {
			let errorOutput = "";
			let fileContents = this.$fs.readText(sourceFile).wait();
			let domErrorHandler = (level:any, msg:string) => {
				errorOutput += level + EOL + msg + EOL;
			};
			this.getDomParser(domErrorHandler).parseFromString(fileContents, "text/xml");

			return errorOutput || null;
		}).future<string>()();
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
