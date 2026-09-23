import { assert } from "chai";
import { Yok } from "../lib/common/yok";
import { CommandsService } from "../lib/common/services/commands-service";
import { ICommand } from "../lib/common/definitions/commands";

function createTestInjector(command: ICommand): {
	injector: Yok;
	validatedWith: { called: boolean };
} {
	const injector = new Yok();
	const validatedWith = { called: false };

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
		validateOptions: (): void => {
			validatedWith.called = true;
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

		it("skips validation for a command that forwards its options", async () => {
			const { injector, validatedWith } = createTestInjector({
				...baseCommand,
				skipOptionsValidation: true,
			});
			const service = injector.resolve(CommandsService);

			await (<any>service).tryExecuteCommandAction("preview", []);

			assert.isFalse(validatedWith.called);
		});
	});
});
