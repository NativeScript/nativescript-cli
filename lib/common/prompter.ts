import * as prompt from "prompts";
import * as helpers from "./helpers";
import * as readline from "readline";
import { ReadStream } from "tty";
import {
	IAllowEmpty,
	IPrompterAnswers,
	IPrompterOptions,
	IPrompterQuestion
} from "./declarations";
import { injector } from "./yok";
const MuteStream = require("mute-stream");
import * as _ from "lodash";

export class Prompter implements IPrompter {
	private ctrlcReader: readline.ReadLine;
	private muteStreamInstance: any = null;

	public dispose() {
		if (this.ctrlcReader) {
			this.ctrlcReader.close();
		}
	}

	public async get(questions: IPrompterQuestion[]): Promise<any> {
		try {
			this.muteStdout();

			if (!helpers.isInteractive()) {
				if (_.some(questions, (s) => !s.default)) {
					throw new Error(
						"Console is not interactive and no default action specified."
					);
				} else {
					const result: any = {};

					_.each(questions, (s) => {
						// Curly brackets needed because s.default() may return false and break the loop
						result[s.name] = s.default();
					});

					return result;
				}
			} else {
				const result = await prompt.prompt(questions);
				return result;
			}
		} finally {
			this.unmuteStdout();
		}
	}

	public async getPassword(
		message: string,
		options?: IAllowEmpty
	): Promise<string> {
		const schema: IPrompterQuestion = {
			message,
			type: "password",
			name: "password",
			validate: (value: any) => {
				const allowEmpty = options && options.allowEmpty;
				return !allowEmpty && !value ? "Password must be non-empty" : true;
			}
		};

		const result = await this.get([schema]);
		return result.password;
	}

	public async getString(
		message: string,
		options?: IPrompterOptions
	): Promise<string> {
		const schema: IPrompterQuestion = {
			message,
			type: "text",
			name: "inputString",
			validate: (value: any) => {
				const doesNotAllowEmpty =
					options && _.has(options, "allowEmpty") && !options.allowEmpty;
				return doesNotAllowEmpty && !value
					? `${message} must be non-empty`
					: true;
			},
			default: options && options.defaultAction
		};

		const result = await this.get([schema]);
		return result.inputString;
	}

	public async promptForChoice(
		promptMessage: string,
		choices:
			| string[]
			| { title: string; description?: string; value?: string }[],
		multiple: boolean = false,
		options: any = {}
	): Promise<string> {
		const schema: IPrompterAnswers = {
			message: promptMessage,
			type: multiple ? "multiselect" : "select",
			name: "userAnswer",
			choices,
			...options
		};

		const result = await this.get([schema]);

		type ArrayElement<ArrayType extends readonly unknown[]> =
			ArrayType extends readonly (infer ElementType)[] ? ElementType : never;

		type Choice = ArrayElement<typeof choices>;

		const extractValue = (choice: number | Choice) => {
			if (typeof choice === "object") {
				return choice.value || choice;
			}

			if (typeof choice === "string") {
				return choice;
			}

			if (typeof choice === "number") {
				return choices[choice];
			}
		};

		return multiple
			? result.userAnswer.map(extractValue)
			: extractValue(result.userAnswer);
	}

	public async promptForDetailedChoice(
		promptMessage: string,
		choices: { key: string; description: string }[]
	): Promise<string> {
		const inquirerChoices = choices.map((choice) => {
			return {
				title: choice.key,
				value: choice.key,
				description: choice.description
			};
		});

		const schema: any = {
			message: promptMessage,
			type: "select",
			name: "userAnswer",
			choices: inquirerChoices
		};

		const result = await this.get([schema]);
		return result.userAnswer;
	}

	public async confirm(
		message: string,
		defaultAction?: () => boolean
	): Promise<boolean> {
		const schema = {
			type: "confirm",
			name: "prompt",
			default: defaultAction,
			message
		};

		const result = await this.get([schema]);
		return result.prompt;
	}

	private muteStdout(): void {
		if (helpers.isInteractive()) {
			(<ReadStream>process.stdin).setRawMode(true); // After setting rawMode to true, Ctrl+C doesn't work for non node.js events loop i.e device log command

			// We need to create mute-stream and to pass it as output to ctrlcReader
			// This will prevent the prompter to show the user's text twice on the console
			this.muteStreamInstance = new MuteStream();

			this.muteStreamInstance.pipe(process.stdout);
			this.muteStreamInstance.mute();

			this.ctrlcReader = readline.createInterface(<any>{
				input: process.stdin,
				output: this.muteStreamInstance
			});

			this.ctrlcReader.on("SIGINT", () => {
				// enable terminal cursor
				process.stdout.write("\x1B[?25h");

				process.exit();
			});
		}
	}

	private unmuteStdout(): void {
		if (helpers.isInteractive()) {
			(<ReadStream>process.stdin).setRawMode(false);
			if (this.muteStreamInstance) {
				// We need to clean the event listeners from the process.stdout because the MuteStream.pipe function calls the pipe function of the Node js Stream which adds event listeners and this can cause memory leak if we display more than ~10 prompts.
				this.cleanEventListeners(process.stdout);
				this.muteStreamInstance.unmute();
				this.muteStreamInstance = null;
				this.dispose();
			}
		}
	}

	private cleanEventListeners(stream: NodeJS.WritableStream): void {
		// The events names and listeners names can be found here https://github.com/nodejs/node/blob/master/lib/stream.js
		// Which event cause memory leak can be tested with stream.listeners("event-name") and if the listeners count keeps increasing with each prompt we need to remove the listener.
		const memoryLeakEvents: IMemoryLeakEvent[] = [
			{
				eventName: "close",
				listenerName: "cleanup"
			},
			{
				eventName: "error",
				listenerName: "onerror"
			},
			{
				eventName: "drain",
				listenerName: "ondrain"
			}
		];

		_.each(memoryLeakEvents, (memoryleakEvent: IMemoryLeakEvent) =>
			this.cleanListener(
				stream,
				memoryleakEvent.eventName,
				memoryleakEvent.listenerName
			)
		);
	}

	private cleanListener(
		stream: NodeJS.WritableStream,
		eventName: string,
		listenerName: string
	): void {
		const eventListeners: any[] = process.stdout.listeners(eventName);

		const listenerFunction: (...args: any[]) => void = _.find(
			eventListeners,
			(func: any) => func.name === listenerName
		);

		if (listenerFunction) {
			stream.removeListener(eventName, listenerFunction);
		}
	}
}

interface IMemoryLeakEvent {
	eventName: string;
	listenerName: string;
}

injector.register("prompter", Prompter);
