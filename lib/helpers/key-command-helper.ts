import { color } from "../color";
import { stripVTControlCharacters } from "node:util";
import {
	IKeyCommandHelper,
	IKeyCommandPlatform,
	IValidKeyName,
	SpecialKeys,
	SupportedProcessType,
} from "../common/definitions/key-commands";
import { injector } from "../common/yok";

export default class KeyCommandHelper implements IKeyCommandHelper {
	public keyCommandExecutionBlocked: boolean;
	private platform: string = "all";
	private processType: SupportedProcessType;
	private overrides: { [key: string]: () => Promise<boolean> } = {};

	public addOverride(key: IValidKeyName, execute: () => Promise<boolean>) {
		this.overrides[key] = execute;
	}

	public removeOverride(key: IValidKeyName) {
		this.overrides[key] = undefined;
	}

	private onKeyPressed = async (data: Buffer) => {
		const key = data.toString();

		// Allow Ctrl + C always.
		if (this.keyCommandExecutionBlocked && key !== SpecialKeys.CtrlC) return;

		try {
			const exists = injector.getRegisteredKeyCommandsNames().includes(key);

			if (exists) {
				const keyCommand = injector.resolveKeyCommand(key as IValidKeyName);

				if (
					keyCommand.platform === "all" ||
					keyCommand.platform === this.platform ||
					this.platform === "all"
				) {
					if (
						keyCommand.canExecute &&
						!keyCommand.canExecute(this.processType)
					) {
						console.log("blocked execution");
						return;
					}

					if (keyCommand.willBlockKeyCommandExecution)
						this.keyCommandExecutionBlocked = true;

					if (this.overrides[key]) {
						if (!(await this.overrides[key]())) {
							this.keyCommandExecutionBlocked = false;
							process.stdin.resume();
							return;
						}
					}

					if (keyCommand.key !== SpecialKeys.CtrlC) {
						const line = ` ${color.dim("→")} ${color.bold(keyCommand.key)} — ${
							keyCommand.description
						}`;
						const lineLength = stripVTControlCharacters(line).length - 1;
						console.log(color.dim(` ┌${"─".repeat(lineLength)}┐`));
						console.log(line + color.dim(" │"));
						console.log(color.dim(` └${"─".repeat(lineLength)}┘`));
						console.log("");
					}
					const result = await keyCommand.execute(this.platform);
					this.keyCommandExecutionBlocked = false;

					if (process.stdin.setRawMode) {
						process.stdin.resume();
					}

					return result;
				}
			}

			process.stdout.write(key);
		} catch (e) {
			const $logger = injector.resolve("logger") as ILogger;
			$logger.error(e.message);
		}
	};

	public printCommands(platform: IKeyCommandPlatform) {
		const commands = injector.getRegisteredKeyCommandsNames();
		const groupings: { [key: string]: boolean } = {};
		const commandHelp = commands.reduce((arr, key) => {
			const command = injector.resolveKeyCommand(key as IValidKeyName);

			if (
				!command.description ||
				(command.platform !== "all" &&
					command.platform !== platform &&
					platform !== "all") ||
				(command.canExecute && !command.canExecute(this.processType))
			) {
				return arr;
			} else {
				if (!groupings[command.group]) {
					groupings[command.group] = true;
					arr.push(` \n${color.underline(color.bold(command.group))}\n`);
				}
				arr.push(`   ${color.bold(command.key)} — ${command.description}`);
				return arr;
			}
		}, []);

		console.info(
			[
				"",
				`  The CLI is ${color.underline(
					`interactive`,
				)}, you can press the following keys any time (make sure the terminal has focus).`,
				"",
				...commandHelp,
				"",
			].join("\n"),
		);
	}

	public attachKeyCommands(
		platform: IKeyCommandPlatform,
		processType: SupportedProcessType,
	) {
		this.processType = processType;
		this.platform = platform;

		const stdin = process.stdin;
		if (!stdin.setRawMode) {
			process.on("message", (key: string) => {
				this.onKeyPressed(Buffer.from(key));
			});
		} else {
			stdin.setRawMode(false);
			stdin.setRawMode(true);
			stdin.resume();

			stdin.on("data", this.onKeyPressed);
		}
	}

	public detachKeyCommands() {
		process.stdin.off("data", this.onKeyPressed);
		process.stdin.setRawMode(false);
	}
}

injector.register("keyCommandHelper", KeyCommandHelper);
