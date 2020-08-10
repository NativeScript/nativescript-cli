import { Block } from "../codeGeneration/code-entity";
import { CodePrinter } from "../codeGeneration/code-printer";
import { IServiceContractGenerator, IFileSystem, IMessagesService, IServiceContractClientCode } from "../declarations";
import { CodeGeneration } from "../codeGeneration/code-generation";
import * as _ from 'lodash';
import { injector } from "../yok";

export class MessageContractGenerator implements IServiceContractGenerator {
	constructor(private $fs: IFileSystem,
		private $messagesService: IMessagesService) {
	}

	public async generate(): Promise<IServiceContractClientCode> {
		const interfacesFile = new Block();
		const implementationsFile = new Block();

		implementationsFile.writeLine("//");
		implementationsFile.writeLine("// automatically generated code; do not edit manually!");
		implementationsFile.writeLine("//");
		implementationsFile.writeLine("/* tslint:disable:all */");
		implementationsFile.writeLine("");

		interfacesFile.writeLine("//");
		interfacesFile.writeLine("// automatically generated code; do not edit manually!");
		interfacesFile.writeLine("//");
		interfacesFile.writeLine("/* tslint:disable:all */");

		const messagesClass = new Block("export class Messages implements IMessages");
		const messagesInterface = new Block("interface IMessages");

		_.each(this.$messagesService.pathsToMessageJsonFiles, jsonFilePath => {
			const jsonContents = this.$fs.readJson(jsonFilePath),
				implementationBlock: CodeGeneration.IBlock = new Block(),
				interfaceBlock: CodeGeneration.IBlock = new Block();

			this.generateFileRecursive(jsonContents, "", implementationBlock, 0, { shouldGenerateInterface: false });
			this.generateFileRecursive(jsonContents, "", interfaceBlock, 0, { shouldGenerateInterface: true });
			messagesClass.addBlock(implementationBlock);
			messagesInterface.addBlock(interfaceBlock);
		});

		interfacesFile.addBlock(messagesInterface);
		interfacesFile.writeLine("/* tslint:enable */");
		interfacesFile.writeLine("");

		implementationsFile.addBlock(messagesClass);
		implementationsFile.writeLine("$injector.register('messages', Messages);");
		implementationsFile.writeLine("/* tslint:enable */");
		implementationsFile.writeLine("");

		const codePrinter = new CodePrinter();
		return {
			interfaceFile: codePrinter.composeBlock(interfacesFile),
			implementationFile: codePrinter.composeBlock(implementationsFile)
		};
	}

	private generateFileRecursive(jsonContents: any, propertyValue: string, block: CodeGeneration.IBlock, depth: number, options: { shouldGenerateInterface: boolean }): void {
		_.each(jsonContents, (val: any, key: string) => {
			let newPropertyValue = propertyValue + key;
			const separator = options.shouldGenerateInterface || depth ? ":" : "=";
			const endingSymbol = options.shouldGenerateInterface || !depth ? ";" : ",";

			if (typeof val === "string") {
				const actualValue = options.shouldGenerateInterface ? "string" : `"${newPropertyValue}"`;

				block.writeLine(`${key}${separator} ${actualValue}${endingSymbol}`);
				newPropertyValue = propertyValue;
				return;
			}

			const newBlock = new Block(`${key} ${separator} `);
			newBlock.endingCharacter = endingSymbol;
			this.generateFileRecursive(val, newPropertyValue + ".", newBlock, depth + 1, options);
			block.addBlock(newBlock);
		});
	}
}
injector.register("messageContractGenerator", MessageContractGenerator);
