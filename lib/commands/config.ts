import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { injector } from "../common/yok";
import { IProjectConfigService } from "../definitions/project";
import { SupportedConfigValues } from "../tools/config-manipulation/config-transformer";
import { IErrors } from "../common/declarations";
import { color } from "../color";
import { IOptions } from "../declarations";

export class ConfigListCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $projectConfigService: IProjectConfigService,
		private $options: IOptions,
		private $logger: ILogger,
	) {}

	public async execute(args: string[]): Promise<void> {
		try {
			const config = this.$projectConfigService.readConfig();
			if (this.$options.json) {
				console.log(JSON.stringify(config))
			} else {
				this.$logger.info(this.getValueString(config as SupportedConfigValues));

			}
		} catch (error) {
			this.$logger.info("Failed to read config. Error is: ", error);
		}
	}

	private getValueString(value: SupportedConfigValues, depth = 0): string {
		const indent = () => "  ".repeat(depth);
		if (typeof value === "object") {
			return (
				`${depth > 0 ? "\n" : ""}` +
				Object.keys(value)
					.map((key) => {
						return (
							color.green(`${indent()}${key}: `) +
							// @ts-ignore
							this.getValueString(value[key], depth + 1)
						);
					})
					.join("\n")
			);
		} else {
			return color.yellow(value.toString());
		}
	}
}

export class ConfigGetCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $projectConfigService: IProjectConfigService,
		private $logger: ILogger,
		private $errors: IErrors,
	) {}

	public async execute(args: string[]): Promise<void> {
		try {
			const [key] = args;
			const current = this.$projectConfigService.getValue(key);
			this.$logger.info(current);
		} catch (err) {
			// ignore
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args[0]) {
			this.$errors.failWithHelp("You must specify a key. Eg: ios.id");
		}

		return true;
	}
}

export class ConfigSetCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		private $projectConfigService: IProjectConfigService,
		private $logger: ILogger,
		private $errors: IErrors,
	) {}

	public async execute(args: string[]): Promise<void> {
		const [key, value] = args;
		const current = this.$projectConfigService.getValue(key);
		if (current && typeof current === "object") {
			this.$errors.fail(
				`Unable to change object values. Please update individual values instead.\nEg: ns config set android.codeCache true`,
			);
		}
		const convertedValue = this.getConvertedValue(value);
		const existingKey = current !== undefined;
		const keyDisplay = color.green(key);
		// when current is undefined, return empty string to avoid throw
		const currentDisplay = current ? color.yellow(current) : "";
		const updatedDisplay = color.cyan(convertedValue);

		this.$logger.info(
			`${existingKey ? "Updating" : "Setting"} ${keyDisplay}${
				existingKey ? ` from ${currentDisplay} ` : " "
			}to ${updatedDisplay}`,
		);

		try {
			await this.$projectConfigService.setValue(key, convertedValue);
			this.$logger.info("Done");
		} catch (error) {
			this.$logger.info("Could not update conifg. Error is: ", error);
		}
	}

	public async canExecute(args: string[]): Promise<boolean> {
		if (!args[0]) {
			this.$errors.failWithHelp("You must specify a key. Eg: ios.id");
		}

		if (!args[1]) {
			this.$errors.failWithHelp("You must specify a value.");
		}

		return true;
	}

	private getConvertedValue(v: any): any {
		try {
			return JSON.parse(v);
		} catch (e) {
			// just treat it as a string
			return `${v}`;
		}
	}
}

injector.registerCommand("config|*list", ConfigListCommand);
injector.registerCommand("config|get", ConfigGetCommand);
injector.registerCommand("config|set", ConfigSetCommand);
