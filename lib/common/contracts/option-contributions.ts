import { Contract } from "../di/contract";
import type { OptionsGroup } from "../define-command";

/**
 * Option groups added from outside the command that parses them: a plugin
 * adding flags to `ns run`, or a process-level flag next to the CLI's own.
 * The adapter composes a command's own groups with what is contributed under
 * its names when the invocation parses, and the root table composes the root
 * contributions, so a contribution must be registered before the parse it
 * targets. Spellings collide under the same rules as a command's own groups.
 */
@Contract({ name: "optionContributions" })
export abstract class OptionContributions {
	/** Adds `group` to every invocation of the command registered as `commandName`. */
	abstract contributeToCommand(
		commandName: string,
		group: OptionsGroup<any>,
	): void;

	/**
	 * Adds `group` to the process-level options, parsed at startup and provided
	 * at the root like the CLI's own.
	 */
	abstract contributeToRoot(group: OptionsGroup<any>): void;

	abstract forCommand(commandName: string): OptionsGroup<any>[];

	abstract forRoot(): OptionsGroup<any>[];
}
