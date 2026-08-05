import { assert } from "chai";
import { Yok } from "../lib/common/yok";

const noopCommandFactory = () => ({
	execute: async (): Promise<void> => undefined,
});

describe("yok: command registration", () => {
	let injector: Yok;

	beforeEach(() => {
		injector = new Yok();
	});

	describe("registerCommand with a hierarchical name", () => {
		it("records the subcommand under its parent", () => {
			injector.registerCommand("dev|test", noopCommandFactory);

			assert.deepStrictEqual(injector.getChildrenCommandsNames("dev"), [
				"test",
			]);
		});

		it("routes arguments through the parent name", () => {
			injector.registerCommand("dev|test", noopCommandFactory);

			const built = injector.buildHierarchicalCommand("dev", ["test", "extra"]);

			assert.deepStrictEqual(built, {
				commandName: "dev|test",
				remainingArguments: ["extra"],
			});
		});

		it("synthesizes a dispatcher for the parent", () => {
			injector.registerCommand("dev|test", noopCommandFactory);

			const parent = injector.resolveCommand("dev");

			assert.isTrue((<any>parent).isHierarchicalCommand);
		});

		it("records each sibling once, including default commands", () => {
			injector.registerCommand("dev|*test", noopCommandFactory);
			injector.registerCommand("dev|lint", noopCommandFactory);

			assert.deepStrictEqual(injector.getChildrenCommandsNames("dev"), [
				"*test",
				"lint",
			]);
		});

		it("does not duplicate a subcommand already recorded by requireCommand", () => {
			injector.requireCommand("dev|test", "some-file");
			injector.registerCommand("dev|test", noopCommandFactory);

			assert.deepStrictEqual(injector.getChildrenCommandsNames("dev"), [
				"test",
			]);
		});
	});
});
