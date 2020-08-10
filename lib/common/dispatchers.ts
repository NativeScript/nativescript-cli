import * as _ from 'lodash';
import * as queue from "./queue";
import * as path from "path";
import { hook } from "./helpers";
import { ICommandDispatcher, ICancellationService, ISysInfo, IFileSystem, IFutureDispatcher, IQueue, IErrors } from "./declarations";
import { IOptions } from "../declarations";
import { IInjector, $injector } from "./definitions/yok";

export class CommandDispatcher implements ICommandDispatcher {
	constructor(private $logger: ILogger,
		// required by the hooksService
		protected $injector: IInjector,
		private $cancellation: ICancellationService,
		private $commandsService: ICommandsService,
		private $staticConfig: Config.IStaticConfig,
		private $sysInfo: ISysInfo,
		private $options: IOptions,
		private $fs: IFileSystem) { }

	public async dispatchCommand(): Promise<void> {
		if (this.$options.version) {
			return this.printVersion();
		}

		if (this.$logger.getLevel() === "TRACE") {
			// CommandDispatcher is called from external CLI's only, so pass the path to their package.json
			const sysInfo = await this.$sysInfo.getSysInfo({ pathToNativeScriptCliPackageJson: path.join(__dirname, "..", "..", "package.json") });
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

		({ commandName, commandArguments, argv: process.argv } = await this.resolveCommand(commandName, commandArguments, process.argv));

		await this.$cancellation.begin("cli");

		await this.$commandsService.tryExecuteCommand(commandName, commandArguments);
	}

	public async completeCommand(): Promise<boolean> {
		return this.$commandsService.completeCommand();
	}

	@hook("resolveCommand")
	private async resolveCommand(commandName: string, commandArguments: string[], argv: string[]) {
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

	private printVersion(): void {
		let version = this.$staticConfig.version;

		const json = this.$fs.readJson(this.$staticConfig.pathToPackageJson);
		if (json && json.buildVersion) {
			version = `${version}-${json.buildVersion}`;
		}
		this.$logger.info(version);
	}
}
$injector.register("commandDispatcher", CommandDispatcher);

class FutureDispatcher implements IFutureDispatcher {
	private actions: IQueue<any>;

	public constructor(private $errors: IErrors) { }

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
$injector.register("dispatcher", FutureDispatcher, false);
