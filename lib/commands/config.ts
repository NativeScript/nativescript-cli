import { IProjectConfigService } from "../definitions/project";
import { SupportedConfigValues } from "../tools/config-manipulation/config-transformer";
import { CommandContext, defineCommand } from "../common/define-command";
import { inject } from "../common/di";
import { color } from "../color";

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

function requireConfigKey(context: CommandContext): void {
	if (!context.args[0]) {
		context.fail("You must specify a key. Eg: ios.id");
	}
}

export const configListCommandDefinition = defineCommand({
	name: "config|*list",
	description: "Prints the project configuration.",
	params: "none",
	async run(): Promise<void> {
		const $projectConfigService = inject<IProjectConfigService>(
			"projectConfigService",
		);
		const $logger = inject<ILogger>("logger");

		try {
			const config = $projectConfigService.readConfig();
			$logger.info(getValueString(config as SupportedConfigValues));
		} catch (error) {
			$logger.info("Failed to read config. Error is: ", error);
		}
	},
});

export const configGetCommandDefinition = defineCommand({
	name: "config|get",
	description: "Prints the value the project configuration holds for a key.",
	params: "any",
	async canExecute(context): Promise<boolean> {
		requireConfigKey(context);

		return true;
	},
	async run(context): Promise<void> {
		const $projectConfigService = inject<IProjectConfigService>(
			"projectConfigService",
		);
		const $logger = inject<ILogger>("logger");

		try {
			const [key] = context.args;
			const current = $projectConfigService.getValue(key);
			$logger.info(current);
		} catch (err) {
			// ignore
		}
	},
});

export const configSetCommandDefinition = defineCommand({
	name: "config|set",
	description: "Sets a value in the project configuration.",
	params: "any",
	async canExecute(context): Promise<boolean> {
		requireConfigKey(context);

		if (!context.args[1]) {
			context.fail("You must specify a value.");
		}

		return true;
	},
	async run(context): Promise<void> {
		const $projectConfigService = inject<IProjectConfigService>(
			"projectConfigService",
		);
		const $logger = inject<ILogger>("logger");

		const [key, value] = context.args;
		const current = $projectConfigService.getValue(key);
		if (current && typeof current === "object") {
			context.fail(
				`Unable to change object values. Please update individual values instead.\nEg: ns config set android.codeCache true`,
				{ help: false },
			);
		}
		const convertedValue = getConvertedValue(value);
		const existingKey = current !== undefined;
		const keyDisplay = color.green(key);
		// when current is undefined, return empty string to avoid throw
		const currentDisplay = current ? color.yellow(current) : "";
		const updatedDisplay = color.cyan(convertedValue);

		$logger.info(
			`${existingKey ? "Updating" : "Setting"} ${keyDisplay}${
				existingKey ? ` from ${currentDisplay} ` : " "
			}to ${updatedDisplay}`,
		);

		try {
			await $projectConfigService.setValue(key, convertedValue);
			$logger.info("Done");
		} catch (error) {
			$logger.info("Could not update conifg. Error is: ", error);
		}
	},
});
