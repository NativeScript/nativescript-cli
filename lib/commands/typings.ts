import { cache } from "../common/decorators";
import { IOptions } from "../declarations";
import { IChildProcess, IFileSystem } from "../common/declarations";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import { IProjectData } from "../definitions/project";

export class TypingsCommandBase implements ICommand {
	public platform: string;
	constructor(
		// private $logger: ILogger,
		private $options: IOptions,
		private $fs: IFileSystem,
		private $projectData: IProjectData
	) // private $childProcess: IChildProcess,
	{}

	public allowedParameters: ICommandParameter[] = [];
	public async execute(args: string[]): Promise<void> {
		if (this.$options.copyTo) {
			this.$fs.copyFile(
				`${this.$projectData.projectDir}/typings/`,
				this.$options.copyTo
			);
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
		private $options: IOptions,
		private $fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $projectData: IProjectData
	) {}

	public async execute(args: string[]): Promise<void> {
		if (this.$options.filter !== undefined) {
			return this.$logger.error("--filter flag is not supported yet.");
		}

		this.$fs.ensureDirectoryExists(
			`${this.$projectData.projectDir}/typings/ios`
		);

		const result = await this.$childProcess.exec(
			`TNS_TYPESCRIPT_DECLARATIONS_PATH=${this.$projectData.projectDir}/typings/ios ns build ios`
		);
		this.$logger.error(result);

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
		private $options: IOptions,
		private $fs: IFileSystem,
		private $childProcess: IChildProcess,
		private $projectData: IProjectData
	) {}

	public async execute(args: string[]): Promise<void> {
		if (this.$options.aar) {
			return this.$logger.warn(`Open the .aar archive
Extract the classes.jar and any dependencies it may have inside libs/
Rename classes.jar if necessary

ns typings android --jar classes.jar --jar dependency-of-classes-jar.jar
			`);
		}

		if (!this.$options.jar) {
			return this.$logger.warn(
				"No .jar file specified. Please specify a .jar file to generate typings."
			);
		}

		this.$fs.ensureDirectoryExists(
			`${this.$projectData.projectDir}/typings/android`
		);

		if (
			!this.$fs.exists(
				`${this.$projectData.projectDir}/platforms/android/build-tools/dts-generator.jar`
			)
		) {
			return this.$logger.error(
				"No platforms folder found. Please run ns prepare android."
			);
		}

		if (this.$options.jar) {
			let jars: string[] =
				typeof this.$options.jar === "string"
					? [this.$options.jar]
					: this.$options.jar;
			const result = await this.$childProcess.exec(
				`java -jar ${
					this.$projectData.projectDir
				}/platforms/android/build-tools/dts-generator.jar -input ${jars.join(
					" "
				)} -output ${this.$projectData.projectDir}/typings/android/`
			);
			this.$logger.info(result);
		}
		return this.typingsCommand.execute(args);
	}

	public async canExecute(args: string[]): Promise<boolean> {
		return await this.typingsCommand.canExecute(args);
	}
}

injector.registerCommand("typings|android", TypingsAndroidCommand);
