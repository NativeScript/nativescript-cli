import { EventEmitter } from "events";
import { assert } from "chai";
import { LiveCommand } from "../../lib/commands/live";
import { Yok } from "../../lib/common/yok";
import { registerCommand } from "../../lib/common/services/command-definition-adapter";
import { runInInjectionContext } from "../../lib/common/di";

function createTestInjector(exitCode: number) {
	const spawned: { command: string; args: string[] }[] = [];
	const testInjector = new Yok();
	testInjector.register("childProcess", {
		spawn: (command: string, args: string[]) => {
			spawned.push({ command, args });
			const child = new EventEmitter();
			setImmediate(() => child.emit("close", exitCode));
			return child;
		},
	});
	testInjector.register("errors", {
		fail: (message: string) => {
			throw new Error(message);
		},
		failWithHelp: (message: string) => {
			throw new Error(message);
		},
	});
	testInjector.register("options", {});
	runInInjectionContext(testInjector, () => registerCommand(LiveCommand));
	return { testInjector, spawned };
}

describe("live command", () => {
	const originalArgv = process.argv;

	afterEach(() => {
		process.argv = originalArgv;
	});

	it("runs the live CLI through npx with the flags after `live`", async () => {
		process.argv = ["node", "ns", "live", "--mac", "--new"];
		const { testInjector, spawned } = createTestInjector(0);

		await testInjector.resolveCommand("live").execute(["--mac", "--new"]);

		assert.deepEqual(spawned, [
			{
				command: "npx",
				args: [
					"--yes",
					"@nativescript/cloudflare-cli@latest",
					"live",
					"--mac",
					"--new",
				],
			},
		]);
	});

	it("fails when the live CLI exits with an error", async () => {
		process.argv = ["node", "ns", "live", "--ios"];
		const { testInjector } = createTestInjector(1);

		let error: Error | undefined;
		try {
			await testInjector.resolveCommand("live").execute(["--ios"]);
		} catch (e) {
			error = e;
		}

		assert.equal(error?.message, "ns live exited with code 1.");
	});
});
