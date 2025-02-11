import * as _ from "lodash";
import * as queue from "./queue";
import * as path from "path";
import { hook } from "./helpers";
import {
	ICommandDispatcher,
	ICancellationService,
	ISysInfo,
	IFutureDispatcher,
	IQueue,
	IErrors
} from "./declarations";
import { IOptions, IPackageManager, IVersionsService } from "../declarations";
import { IInjector } from "./definitions/yok";
import { injector } from "./yok";
import { PackageManagers } from "../constants";
import { ITerminalSpinnerService } from "../definitions/terminal-spinner-service";
import * as semver from "semver";

export class CommandDispatcher implements ICommandDispatcher {
	constructor(
		private $logger: ILogger,
		// required by the hooksService
		protected $injector: IInjector,
		private $cancellation: ICancellationService,
		private $commandsService: ICommandsService,
		private $staticConfig: Config.IStaticConfig,
		private $sysInfo: ISysInfo,
		private $options: IOptions,
		private $versionsService: IVersionsService,
		private $packageManager: IPackageManager,
		private $terminalSpinnerService: ITerminalSpinnerService
	) {}

	public async dispatchCommand(): Promise<void> {
		if (this.$options.version) {
			return this.printVersion();
		}

		if (this.$logger.getLevel() === "TRACE" && !this.$options.json) {
			// CommandDispatcher is called from external CLI's only, so pass the path to their package.json
			this.$logger.trace("Collecting system information...");
			const sysInfo = await this.$sysInfo.getSysInfo({
				pathToNativeScriptCliPackageJson: path.join(
					__dirname,
					"..",
					"..",
					"package.json"
				)
			});
			this.$logger.trace("System information:");
			this.$logger.trace(JSON.stringify(sysInfo, null, 2));
			this.$logger.trace("Current CLI version: ", this.$staticConfig.version);
		}

		let commandName = this.getCommandName();
		let commandArguments = this.$options.argv._.slice(1);
		const lastArgument: string = _.last(commandArguments);

		if (this.$options.help) {
			commandArguments.unshift(commandName);
			commandName = "help";
		} else if (lastArgument === "/?" || lastArgument === "?") {
			commandArguments.pop();
			commandArguments.unshift(commandName);
			commandName = "help";
		}

		({
			commandName,
			commandArguments,
			argv: process.argv
		} = await this.resolveCommand(commandName, commandArguments, process.argv));

		await this.$cancellation.begin("cli");

		await this.$commandsService.tryExecuteCommand(
			commandName,
			commandArguments
		);
	}

	@hook("resolveCommand")
	private async resolveCommand(
		commandName: string,
		commandArguments: string[],
		argv: string[]
	) {
		// just a hook point
		return { commandName, commandArguments, argv };
	}

	private getCommandName(): string {
		const remaining: string[] = this.$options.argv._;
		if (remaining.length > 0) {
			return remaining[0].toString().toLowerCase();
		}
		// if only <CLI_NAME> is specified on console, show console help
		this.$options.help = true;
		return "";
	}

	private async printVersion(): Promise<void> {
		this.$logger.info(this.$staticConfig.version);

		if (this.$options.json) {
			// we don't check for updates when --json is passed
			// useful for tools that rely on the output of the command
			return;
		}

		const spinner = this.$terminalSpinnerService.createSpinner();
		spinner.start("Checking for updates...");
		const nativescriptCliVersion =
			await this.$versionsService.getNativescriptCliVersion();
		spinner.stop();

		const packageManagerName =
			await this.$packageManager.getPackageManagerName();
		let updateCommand = "";

		switch (packageManagerName) {
			case PackageManagers.yarn:
			case PackageManagers.yarn2:
				updateCommand = "yarn global add nativescript";
				break;
			case PackageManagers.pnpm:
				updateCommand = "pnpm i -g nativescript";
				break;
			case PackageManagers.bun:
				updateCommand = "bun add --global nativescript";
				break;
			case PackageManagers.npm:
			default:
				updateCommand = "npm i -g nativescript";
				break;
		}

		if (
			semver.gte(
				nativescriptCliVersion.currentVersion,
				nativescriptCliVersion.latestVersion,
				{
					loose: true
				}
			)
		) {
			// up-to-date
			spinner.succeed("Up to date.");
		} else {
			spinner.info(
				`New version of NativeScript CLI is available (${nativescriptCliVersion.latestVersion}), run '${updateCommand}' to update.`
			);
		}
	}
}
injector.register("commandDispatcher", CommandDispatcher);

class FutureDispatcher implements IFutureDispatcher {
	private actions: IQueue<any>;

	public constructor(private $errors: IErrors) {}

	public async run(): Promise<void> {
		if (this.actions) {
			this.$errors.fail("You cannot run a running future dispatcher.");
		}
		this.actions = new queue.Queue<any>();

		while (true) {
			const action = await this.actions.dequeue();
			await action();
		}
	}

	public dispatch(action: () => Promise<void>) {
		this.actions.enqueue(action);
	}
}
injector.register("dispatcher", FutureDispatcher, false);
