import * as path from "path";
import { IFileSystem, IServiceContractGenerator } from "../declarations";
import {
	booleanOption,
	CommandOptionsSchema,
	defineCommand,
} from "../define-command";
import { inject } from "../di";

const MESSAGES_DEFINITIONS_FILE_NAME = "messages.interface.d.ts";
const MESSAGES_IMPLEMENTATION_FILE_NAME = "messages.ts";

const generateMessagesCommandOptions = {
	default: booleanOption(),
} satisfies CommandOptionsSchema;

export const generateMessagesCommandDefinition = defineCommand({
	name: "dev-generate-messages",
	description: "Regenerates the CLI's message contracts.",
	options: generateMessagesCommandOptions,
	arguments: "none",
	async run(context): Promise<void> {
		const $fs = inject<IFileSystem>("fs");
		const $messageContractGenerator = inject<IServiceContractGenerator>(
			"messageContractGenerator",
		);

		const result = await $messageContractGenerator.generate();
		const innerMessagesDirectory = path.join(__dirname, "../messages");
		const outerMessagesDirectory = path.join(__dirname, "../..");
		let interfaceFilePath: string;
		let implementationFilePath: string;

		if (context.options.default) {
			interfaceFilePath = path.join(
				innerMessagesDirectory,
				MESSAGES_DEFINITIONS_FILE_NAME,
			);
			implementationFilePath = path.join(
				innerMessagesDirectory,
				MESSAGES_IMPLEMENTATION_FILE_NAME,
			);
		} else {
			interfaceFilePath = path.join(
				outerMessagesDirectory,
				MESSAGES_DEFINITIONS_FILE_NAME,
			);
			implementationFilePath = path.join(
				outerMessagesDirectory,
				MESSAGES_IMPLEMENTATION_FILE_NAME,
			);
		}

		$fs.writeFile(interfaceFilePath, result.interfaceFile);
		$fs.writeFile(implementationFilePath, result.implementationFile);
	},
});
