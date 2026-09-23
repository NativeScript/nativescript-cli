import { CliOptions } from "../contracts/cli-options";
import { OptionContributions } from "../contracts/option-contributions";
import {
	isOptionsGroup,
	OptionsGroup,
	optionSpellingsOf,
	readOptionValues,
	resolveCommandOptions,
} from "../define-command";
import type { Injector } from "../di/injector";
import { injector } from "../yok";

export class OptionContributionsRegistry extends OptionContributions {
	private byCommand = new Map<string, OptionsGroup<any>[]>();
	private root: OptionsGroup<any>[] = [];

	constructor(private $injector: Injector) {
		super();
	}

	public contributeToCommand(
		commandName: string,
		group: OptionsGroup<any>,
	): void {
		if (typeof commandName !== "string" || !commandName.trim()) {
			throw new Error(
				"An option contribution names the command it applies to.",
			);
		}
		assertGroup(group);
		const groups = this.byCommand.get(commandName) || [];
		if (groups.indexOf(group) === -1) {
			groups.push(group);
		}
		this.byCommand.set(commandName, groups);
	}

	public contributeToRoot(group: OptionsGroup<any>): void {
		assertGroup(group);
		if (this.root.indexOf(group) !== -1) {
			return;
		}
		// The root table is one parse, so its groups collide like a command's,
		// and a spelling already at the root is refused even with the same
		// spec: the group would claim a flag it does not own.
		const report = (problem: string): never => {
			throw new Error(`Option group '${group.groupName}': ${problem}`);
		};
		const rootSpellings = new Set<string>();
		for (const rootGroup of [CliOptions, ...this.root]) {
			for (const spelling of optionSpellingsOf(rootGroup.schema)) {
				rootSpellings.add(spelling);
			}
		}
		for (const spelling of optionSpellingsOf(group.schema)) {
			if (rootSpellings.has(spelling)) {
				report(
					`'${spelling.length === 1 ? "-" : "--"}${spelling}' is already a process-level option`,
				);
			}
		}
		resolveCommandOptions([CliOptions, ...this.root, group], report);
		this.root.push(group);
		// Provided next to CliOptions on the root injector. Read at every
		// injection rather than cached: the table is parsed again when the
		// group joins it, and an injection before that parse must not pin the
		// values it saw.
		this.$injector.register({
			provide: group,
			shared: false,
			useFactory: () =>
				readOptionValues(group.schema, this.$injector.get("options")),
		});
	}

	public forCommand(commandName: string): OptionsGroup<any>[] {
		return (this.byCommand.get(commandName) || []).slice();
	}

	public forRoot(): OptionsGroup<any>[] {
		return this.root.slice();
	}
}

function assertGroup(group: any): void {
	if (!isOptionsGroup(group)) {
		throw new Error(
			"An option contribution is an option group, as defineOptions() returns.",
		);
	}
}

injector.register("optionContributions", OptionContributionsRegistry);
