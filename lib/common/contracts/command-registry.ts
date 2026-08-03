import { Contract } from "../di/contract";
import type { ICommand } from "../definitions/commands";

/**
 * The command-registry face of the injector facade. Transitional contract: it
 * mirrors what consumers call today, so that extracting the registry from the
 * facade later is a provider swap for this token, not a consumer migration.
 * Members slated for replacement keep their deprecation markers.
 */
@Contract({ name: "commandRegistry" })
export abstract class CommandRegistry {
	/**
	 * @deprecated Path-based command registration; slated for replacement by
	 * manifest-declared commands.
	 */
	abstract requireCommand(names: string | string[], file: string): void;
	abstract registerCommand(names: string | string[], resolver: any): void;
	abstract resolveCommand(name: string): ICommand;
	abstract getRegisteredCommandsNames(includeDev: boolean): string[];
	abstract getChildrenCommandsNames(commandName: string): string[];
	abstract buildHierarchicalCommand(
		parentCommandName: string,
		commandLineArguments: string[],
	): any;
	/** Side-effecting: fails with help output on a bad subcommand. */
	abstract isValidHierarchicalCommand(
		commandName: string,
		commandArguments: string[],
	): Promise<boolean>;
	abstract isDefaultCommand(commandName: string): boolean;
}
