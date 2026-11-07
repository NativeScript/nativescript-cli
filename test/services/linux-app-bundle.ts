import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { assert } from "chai";
import { LinuxAppBundler } from "../../lib/services/linux-app-bundle";
import * as stubs from "../stubs";

/** Fakes ns-bundle: `pack` writes the bundle and patches the executable. */
function fakeTool(exitCode = 0, keyFromEnv = true) {
	const calls: string[][] = [];
	const envs: (NodeJS.ProcessEnv | undefined)[] = [];
	return {
		calls,
		envs,
		spawnFromEvent: async (
			_command: string,
			args: string[],
			_event: string,
			options: { env?: NodeJS.ProcessEnv },
		) => {
			if (args[0] === "--help") {
				const stdout = keyFromEnv ? "usage ... $NS_BUNDLE_KEY_HEX" : "usage";
				return { exitCode: 0, stdout, stderr: "" };
			}
			calls.push(args);
			envs.push(options?.env);
			if (exitCode === 0 && args[0] === "pack") {
				const output = args[args.indexOf("--output") + 1];
				fs.writeFileSync(output, "NSB2");
				fs.mkdirSync(`${output}.unpacked/fonts`, { recursive: true });
				fs.writeFileSync(args[args.indexOf("--exe") + 1], "patched");
			} else if (args[0] === "pack") {
				// a failed run may leave a half patched executable
				fs.writeFileSync(args[args.indexOf("--exe") + 1], "half");
			}
			return { exitCode, stdout: "ok", stderr: exitCode ? "boom" : "" };
		},
	};
}

describe("linuxAppBundle", () => {
	let root: string;
	let stage: string;
	let executable: string;
	let toolsDir: string;

	beforeEach(() => {
		root = fs.mkdtempSync(path.join(os.tmpdir(), "ns-linux-bundle-"));
		stage = path.join(root, "stage");
		toolsDir = path.join(root, "tools");
		executable = path.join(stage, "app-exe");
		fs.mkdirSync(path.join(stage, "app"), { recursive: true });
		fs.writeFileSync(path.join(stage, "app", "bundle.js"), "");
		fs.writeFileSync(executable, "runtime");
		fs.mkdirSync(toolsDir);
		fs.writeFileSync(path.join(toolsDir, "ns-bundle"), "");
	});

	afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

	const pack = (proc: any, extra: any = {}) =>
		new LinuxAppBundler(proc, new stubs.LoggerStub()).pack({
			stage,
			executable,
			toolsDir,
			config: {},
			...extra,
		});

	it("bundles by default and links app/ to the unpacked files", async () => {
		const proc = fakeTool();
		await pack(proc);
		const [args] = proc.calls;
		assert.equal(args[0], "pack");
		assert.notInclude(args, "--seal");
		assert.includeMembers(args, [
			"bundleIntegrity=on",
			"onlyLoadAppFromBundle=on",
			"inspector=off",
			"envOverrides=off",
		]);
		assert.equal(
			fs.readlinkSync(path.join(stage, "app")),
			"app.nsbundle.unpacked",
		);
	});

	it("seals with the given key and unpack globs", async () => {
		const proc = fakeTool();
		await pack(proc, {
			sourceProtect: true,
			keyHex: "ab".repeat(32),
			config: { bundleUnpack: ["data/**"], fuses: { inspector: true } },
		});
		const [args] = proc.calls;
		assert.includeMembers(args, [
			"--seal",
			"--no-default-unpack",
			"data/**",
			"inspector=on",
		]);
		// not on argv, where other local users can read it
		assert.notInclude(args, "ab".repeat(32));
		assert.equal(proc.envs[0].NS_BUNDLE_KEY_HEX, "ab".repeat(32));
	});

	it("passes the key on argv to tools without NS_BUNDLE_KEY_HEX", async () => {
		const proc = fakeTool(0, false);
		await pack(proc, { sourceProtect: true, keyHex: "cd".repeat(32) });
		assert.includeMembers(proc.calls[0], ["--key-hex", "cd".repeat(32)]);
		assert.isUndefined(proc.envs[0]);
	});

	it("only sets fuses with bundle: false", async () => {
		const proc = fakeTool();
		await pack(proc, { config: { bundle: false } });
		assert.equal(proc.calls[0][0], "fuses");
		assert.includeMembers(proc.calls[0], [
			"bundleIntegrity=off",
			"inspector=off",
		]);
		assert.isTrue(fs.statSync(path.join(stage, "app")).isDirectory());
	});

	it("keeps the plain folder when bundling fails", async () => {
		await pack(fakeTool(1));
		assert.isTrue(fs.statSync(path.join(stage, "app")).isDirectory());
		assert.isFalse(fs.existsSync(path.join(stage, "app.nsbundle")));
		assert.equal(fs.readFileSync(executable, "utf8"), "runtime");
	});

	it("fails the build when source protection fails", async () => {
		let error: Error;
		await pack(fakeTool(1), { sourceProtect: true }).catch((e) => (error = e));
		assert.match(error.message, /Source protection failed/);
		assert.equal(fs.readFileSync(executable, "utf8"), "runtime");
		fs.rmSync(path.join(toolsDir, "ns-bundle"));
		error = undefined;
		await pack(fakeTool(), {
			config: { sourceProtect: true },
		}).catch((e) => (error = e));
		assert.match(error.message, /no ns-bundle/);
		// a plain release still builds without the tool
		await pack(fakeTool());
	});

	it("lets --no-source-protect override the config", async () => {
		const proc = fakeTool();
		await pack(proc, { sourceProtect: false, config: { sourceProtect: true } });
		assert.notInclude(proc.calls[0], "--seal");
	});
});
