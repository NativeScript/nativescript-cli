import { assert } from "chai";
import { Yok } from "../lib/common/yok";
import { CommandsService } from "../lib/common/services/commands-service";
import { ICommand } from "../lib/common/definitions/commands";

function createTestInjector(command: ICommand): {
	injector: Yok;
	validatedWith: { called: boolean; allowUnknown?: boolean };
} {
	const injector = new Yok();
	const validatedWith: { called: boolean; allowUnknown?: boolean } = {
		called: false,
	};

	injector.register("errors", {
		fail: (message: string): void => {
			throw new Error(message);
		},
		failWithHelp: (message: string): void => {
			throw new Error(message);
		},
	});
	injector.register("hooksService", {});
	injector.register("logger", { warn: (): void => undefined });
	injector.register("options", {
		validateOptions: (dashedOptions: any, allowUnknown?: boolean): void => {
			validatedWith.called = true;
			validatedWith.allowUnknown = allowUnknown;
		},
	});
	injector.register("staticConfig", {});
	injector.register("extensibilityService", {});
	injector.register("optionsTracker", {});

	injector.resolveCommand = () => command;

	return { injector, validatedWith };
}

describe("commands-service", () => {
	describe("option validation", () => {
		const baseCommand: ICommand = {
			execute: async (): Promise<void> => undefined,
			allowedParameters: [],
			canExecute: async (): Promise<boolean> => true,
		};

		it("validates the options of an ordinary command", async () => {
			const { injector, validatedWith } = createTestInjector(baseCommand);
			const service = injector.resolve(CommandsService);

			await (<any>service).tryExecuteCommandAction("info", []);

			assert.isTrue(validatedWith.called);
		});

		it("tolerates unknown options for a command that forwards them", async () => {
			const { injector, validatedWith } = createTestInjector({
				...baseCommand,
				allowUnknownOptions: true,
			});
			const service = injector.resolve(CommandsService);

			await (<any>service).tryExecuteCommandAction("preview", []);

			// Validation still runs so the command's own options are merged;
			// only the rejection of foreign flags is suppressed.
			assert.isTrue(validatedWith.called);
			assert.isTrue(validatedWith.allowUnknown);
		});
	});
});
