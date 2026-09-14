import { IProjectConfigService } from "../definitions/project";
import { SupportedConfigValues } from "../tools/config-manipulation/config-transformer";
import { IErrors } from "../common/declarations";
import { CommandContext, defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { color } from "../color";

export interface IConfigCommandServices {
	$projectConfigService: IProjectConfigService;
	$logger: ILogger;
	$errors: IErrors;
}

export function injectConfigCommandServices(): IConfigCommandServices {
	return {
		$projectConfigService: inject<IProjectConfigService>(
			"projectConfigService",
		),
		$logger: inject<ILogger>("logger"),
		$errors: inject<IErrors>("errors"),
	};
}

function getValueString(value: SupportedConfigValues, depth = 0): string {
	const indent = () => "  ".repeat(depth);
	if (typeof value === "object") {
		return (
			`${depth > 0 ? "\n" : ""}` +
			Object.keys(value)
				.map((key) => {
					return (
						color.green(`${indent()}${key}: `) +
						// @ts-ignore
						getValueString(value[key], depth + 1)
					);
				})
				.join("\n")
		);
	} else {
		return color.yellow(
			typeof value === "undefined" ? "undefined" : value.toString(),
		);
	}
}

function getConvertedValue(v: any): any {
	try {
		return JSON.parse(v);
	} catch (e) {
		// just treat it as a string
		return `${v}`;
	}
}

export function requireConfigKey(
	context: CommandContext,
	services: IConfigCommandServices,
): void {
	if (!context.args[0]) {
		services.$errors.failWithHelp("You must specify a key. Eg: ios.id");
	}
}

export const configListCommandDefinition = defineCommand({
	name: "config|*list",
	description: "Prints the project configuration.",
	arguments: "none",
	setup: injectConfigCommandServices,
	async run(context, services): Promise<void> {
		try {
			const config = services.$projectConfigService.readConfig();
			services.$logger.info(getValueString(config as SupportedConfigValues));
		} catch (error) {
			services.$logger.info("Failed to read config. Error is: ", error);
		}
	},
});

export const configGetCommandDefinition = defineCommand({
	name: "config|get",
	description: "Prints the value the project configuration holds for a key.",
	arguments: "any",
	setup: injectConfigCommandServices,
	async canExecute(context, services): Promise<boolean> {
		requireConfigKey(context, services);

		return true;
	},
	async run(context, services): Promise<void> {
		try {
			const [key] = context.args;
			const current = services.$projectConfigService.getValue(key);
			services.$logger.info(current);
		} catch (err) {
			// ignore
		}
	},
});

export const configSetCommandDefinition = defineCommand({
	name: "config|set",
	description: "Sets a value in the project configuration.",
	arguments: "any",
	setup: injectConfigCommandServices,
	async canExecute(context, services): Promise<boolean> {
		requireConfigKey(context, services);

		if (!context.args[1]) {
			services.$errors.failWithHelp("You must specify a value.");
		}

		return true;
	},
	async run(context, services): Promise<void> {
		const [key, value] = context.args;
		const current = services.$projectConfigService.getValue(key);
		if (current && typeof current === "object") {
			services.$errors.fail(
				`Unable to change object values. Please update individual values instead.\nEg: ns config set android.codeCache true`,
			);
		}
		const convertedValue = getConvertedValue(value);
		const existingKey = current !== undefined;
		const keyDisplay = color.green(key);
		// when current is undefined, return empty string to avoid throw
		const currentDisplay = current ? color.yellow(current) : "";
		const updatedDisplay = color.cyan(convertedValue);

		services.$logger.info(
			`${existingKey ? "Updating" : "Setting"} ${keyDisplay}${
				existingKey ? ` from ${currentDisplay} ` : " "
			}to ${updatedDisplay}`,
		);

		try {
			await services.$projectConfigService.setValue(key, convertedValue);
			services.$logger.info("Done");
		} catch (error) {
			services.$logger.info("Could not update conifg. Error is: ", error);
		}
	},
});
