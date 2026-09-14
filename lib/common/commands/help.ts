import * as _ from "lodash";
import { CommandRegistry } from "../contracts/command-registry";
import { IHelpService } from "../declarations";
import {
	booleanOption,
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
} from "../define-command";
import { inject } from "../di";
import { registerCommand } from "../services/command-definition-adapter";

export const helpCommandOptions = {
	help: booleanOption(),
} satisfies CommandOptionsSchema;

export type HelpCommandContext = CommandContext<typeof helpCommandOptions>;

export interface IHelpCommandServices {
	$commandRegistry: CommandRegistry;
	$helpService: IHelpService;
}

export function setupHelpCommand(): IHelpCommandServices {
	return {
		$commandRegistry: inject(CommandRegistry),
		$helpService: inject<IHelpService>("helpService"),
	};
}

export async function runHelpCommand(
	context: HelpCommandContext,
	services: IHelpCommandServices,
): Promise<void> {
	const args = context.args;
	let commandName = (args[0] || "").toLowerCase();
	let commandArguments = _.tail(args);
	const hierarchicalCommand =
		services.$commandRegistry.buildHierarchicalCommand(
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
		await services.$helpService.showCommandLineHelp(commandData);
	} else {
		await services.$helpService.openHelpForCommandInBrowser(commandData);
	}
}

export const helpCommandDefinition = defineCommand({
	name: ["help", "/?"],
	description: "Shows the help for a command.",
	options: helpCommandOptions,
	// The command names whatever command it explains, so every argument after
	// the first is that command's own.
	arguments: "any",
	enableHooks: false,
	setup: setupHelpCommand,
	run: runHelpCommand,
});

registerCommand(helpCommandDefinition);
