import * as path from "path";

export class GenerateMessages implements ICommand {
	private static MESSAGES_DEFINITIONS_FILE_NAME = "messages.interface.d.ts";
	private static MESSAGES_IMPLEMENTATION_FILE_NAME = "messages.ts";

	constructor(private $fs: IFileSystem,
		private $messageContractGenerator: IServiceContractGenerator,
		private $options: ICommonOptions) {
	}

	allowedParameters: ICommandParameter[] = [];

	async execute(args: string[]): Promise<void> {
		const result = await this.$messageContractGenerator.generate();
		const innerMessagesDirectory = path.join(__dirname, "../messages");
		const outerMessagesDirectory = path.join(__dirname, "../..");
		let interfaceFilePath: string;
		let implementationFilePath: string;

		if (this.$options.default) {
			interfaceFilePath = path.join(innerMessagesDirectory, GenerateMessages.MESSAGES_DEFINITIONS_FILE_NAME);
			implementationFilePath = path.join(innerMessagesDirectory, GenerateMessages.MESSAGES_IMPLEMENTATION_FILE_NAME);
		} else {
			interfaceFilePath = path.join(outerMessagesDirectory, GenerateMessages.MESSAGES_DEFINITIONS_FILE_NAME);
			implementationFilePath = path.join(outerMessagesDirectory, GenerateMessages.MESSAGES_IMPLEMENTATION_FILE_NAME);
		}

		this.$fs.writeFile(interfaceFilePath, result.interfaceFile);
		this.$fs.writeFile(implementationFilePath, result.implementationFile);
	}
}
$injector.registerCommand("dev-generate-messages", GenerateMessages);
