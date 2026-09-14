import * as _ from "lodash";
import { CommandRegistry } from "../contracts/command-registry";
import { IHelpService } from "../declarations";
import { booleanOption, defineCommand } from "../define-command";
import { inject } from "../di";

export const helpCommandDefinition = defineCommand({
	name: ["help", "/?"],
	description: "Shows the help for a command.",
	options: {
		help: booleanOption(),
	},
	// The command names whatever command it explains, so every argument after
	// the first is that command's own.
	arguments: "any",
	enableHooks: false,
	async run(context): Promise<void> {
		const $commandRegistry = inject(CommandRegistry);
		const $helpService = inject<IHelpService>("helpService");

		const args = context.args;
		let commandName = (args[0] || "").toLowerCase();
		let commandArguments = _.tail(args);
		const hierarchicalCommand = $commandRegistry.buildHierarchicalCommand(
			args[0],
			commandArguments,
		);
		if (hierarchicalCommand) {
			commandName = hierarchicalCommand.commandName;
			commandArguments = hierarchicalCommand.remainingArguments;
		}

		const commandData: ICommandData = {
			commandName,
			commandArguments,
		};

		if (context.options.help) {
			await $helpService.showCommandLineHelp(commandData);
		} else {
			await $helpService.openHelpForCommandInBrowser(commandData);
		}
	},
});
