import { cache } from "../common/decorators";
import { IOptions } from "../declarations";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";

export class TypingsCommandBase implements ICommand {
	public platform: string;
	constructor(private $logger: ILogger, private $options: IOptions) {}

	public allowedParameters: ICommandParameter[] = [];
	public async execute(args: string[]): Promise<void> {
		const executedString = "Executed command: typings";
		this.$logger.error(args);
		if (this.$options.copyTo) {
			this.$logger.warn(executedString + " --copy-to " + this.$options.copyTo);
		} else if (this.$options.help) {
		} else {
			this.$logger.warn(executedString);
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return true;
	}
}

injector.registerCommand("typings|*all", TypingsCommandBase);

export class TypingsIosCommand implements ICommand {
	@cache()
	private get typingsCommand(): TypingsCommandBase {
		const typingsCommand = this.$injector.resolve<TypingsCommandBase>(
			TypingsCommandBase
		);
		typingsCommand.platform = this.platform;
		return typingsCommand;
	}

	public allowedParameters: ICommandParameter[] = [];
	public get platform(): string {
		return this.$devicePlatformsConstants.iOS;
	}

	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $injector: IInjector,
		private $logger: ILogger,
		private $options: IOptions
	) {}

	public async execute(args: string[]): Promise<void> {
		let executedString = "Executed command: typings android ";
		if (this.$options.filter) {
			executedString = executedString + "--filter " + this.$options.filter;
		}
		await this.$logger.info(executedString);
		return this.typingsCommand.execute(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		const result = await this.typingsCommand.canExecute(args);
		return result;
	}
}

injector.registerCommand("typings|ios", TypingsIosCommand);

export class TypingsAndroidCommand implements ICommand {
	@cache()
	private get typingsCommand(): TypingsCommandBase {
		const typingsCommand = this.$injector.resolve<TypingsCommandBase>(
			TypingsCommandBase
		);
		typingsCommand.platform = this.platform;
		return typingsCommand;
	}

	public allowedParameters: ICommandParameter[] = [];
	public get platform(): string {
		return this.$devicePlatformsConstants.Android;
	}

	constructor(
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $injector: IInjector,
		private $logger: ILogger,
		private $options: IOptions
	) {}

	public async execute(args: string[]): Promise<void> {
		let executedString = "Executed command: typings android ";
		if (this.$options.aar) {
			executedString = executedString + "--aar " + this.$options.aar;
		} else if (this.$options.jar) {
			executedString = executedString + "--jar " + this.$options.jar;
		}
		await this.$logger.error(executedString);
		return this.typingsCommand.execute(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return await this.typingsCommand.canExecute(args);
	}
}

injector.registerCommand("typings|android", TypingsAndroidCommand);
