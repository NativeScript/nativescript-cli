import { assert } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ICliGlobal } from "../../lib/common/definitions/cli-global";

// Pins the published extension contract: an extension is require()d and
// registers its contributions by mutating global.$injector — commands via
// requireCommand/registerCommand (lazy, path-based), services via register.
// extending-cli.md advertises this surface.

const cliGlobal = <ICliGlobal>(<unknown>global);

describe("legacy extension contract", () => {
	let extDir: string;
	let capture: any;

	beforeEach(() => {
		extDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-compat-ext-"));
		capture = (<any>global).__extCapture = {};
	});

	afterEach(() => {
		fs.rmSync(extDir, { recursive: true, force: true });
		delete (<any>global).__extCapture;
	});

	it("an unmodified extension contributes services and hierarchical commands via global.$injector", async () => {
		const commandPath = path.join(extDir, "meow-command");
		fs.writeFileSync(
			commandPath + ".js",
			`class MeowPurrCommand {
				constructor($extCompatService) {
					this.extCompatService = $extCompatService;
					this.allowedParameters = [];
				}
				async execute(args) {
					global.__extCapture.executedWith = args;
					global.__extCapture.service = this.extCompatService;
				}
			}
			global.$injector.registerCommand("meowcompat|purr", MeowPurrCommand);`,
		);
		fs.writeFileSync(
			path.join(extDir, "main.js"),
			`global.$injector.register("extCompatService", { name: "ext-compat-service" });
			global.$injector.requireCommand("meowcompat|purr", ${JSON.stringify(
				commandPath,
			)});`,
		);

		require(path.join(extDir, "main.js"));

		// Registration is lazy: the command module must not load until resolved.
		assert.isUndefined(capture.executedWith);

		// Services registered by the extension resolve under both spellings.
		const service = cliGlobal.$injector.resolve("extCompatService");
		assert.strictEqual(
			cliGlobal.$injector.resolve("$extCompatService"),
			service,
		);
		assert.equal(service.name, "ext-compat-service");

		// The command participates in the hierarchical router.
		assert.include(
			cliGlobal.$injector.getRegisteredCommandsNames(false),
			"meowcompat|purr",
		);
		assert.include(
			cliGlobal.$injector.getChildrenCommandsNames("meowcompat"),
			"purr",
		);
		const built = cliGlobal.$injector.buildHierarchicalCommand("meowcompat", [
			"purr",
			"extra-arg",
		]);
		assert.equal(built.commandName, "meowcompat|purr");
		assert.deepEqual(built.remainingArguments, ["extra-arg"]);

		// The leaf command resolves, gets its DI-injected service, and executes.
		const command = cliGlobal.$injector.resolveCommand("meowcompat|purr");
		assert.isOk(command);
		await command.execute(["fluffy"]);
		assert.deepEqual(capture.executedWith, ["fluffy"]);
		assert.equal(capture.service.name, "ext-compat-service");

		// registerCommand on a hierarchical name synthesized a parent dispatcher.
		const parent = <any>cliGlobal.$injector.resolveCommand("meowcompat");
		assert.isTrue(parent.isHierarchicalCommand);
	});

	it("claiming an already-required command name throws unless overrideAlreadyRequiredModule is set", () => {
		const firstPath = path.join(extDir, "first");
		fs.writeFileSync(firstPath + ".js", `module.exports = {};`);

		cliGlobal.$injector.requireCommand("conflictcompat", firstPath);
		assert.throws(
			() => cliGlobal.$injector.requireCommand("conflictcompat", firstPath),
			/require'd twice/,
		);

		cliGlobal.$injector.overrideAlreadyRequiredModule = true;
		try {
			cliGlobal.$injector.requireCommand("conflictcompat", firstPath);
		} finally {
			cliGlobal.$injector.overrideAlreadyRequiredModule = false;
		}
	});
});
