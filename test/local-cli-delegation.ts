import { assert } from "chai";
import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Drives the real bin entry in a child process: delegation must happen before
// any of lib/ loads, so it can only be observed from the outside.
const repoRoot = path.join(__dirname, "..", "..");
const cliEntry = path.join(repoRoot, "bin", "nativescript.js");
const ownVersion = JSON.parse(
	fs.readFileSync(path.join(repoRoot, "package.json")).toString(),
).version;

const LOCAL_MARKER = "LOCAL_CLI_RAN";

describe("project-local CLI delegation", () => {
	let projectDir: string;

	const makeProject = (options?: {
		localCli?: boolean;
		symlinkToOwnCopy?: boolean;
	}): void => {
		projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-localcli-"));
		fs.writeFileSync(
			path.join(projectDir, "package.json"),
			JSON.stringify({ name: "test-app", version: "1.0.0" }),
		);

		if (options && options.symlinkToOwnCopy) {
			fs.mkdirSync(path.join(projectDir, "node_modules"), { recursive: true });
			fs.symlinkSync(
				repoRoot,
				path.join(projectDir, "node_modules", "nativescript"),
				"junction",
			);
			return;
		}

		if (options && options.localCli) {
			const packageDir = path.join(projectDir, "node_modules", "nativescript");
			fs.mkdirSync(path.join(packageDir, "bin"), { recursive: true });
			fs.writeFileSync(
				path.join(packageDir, "package.json"),
				JSON.stringify({ name: "nativescript", version: "99.0.0-local" }),
			);
			fs.writeFileSync(
				path.join(packageDir, "bin", "tns"),
				`console.log("${LOCAL_MARKER} delegated=" + process.env.NS_CLI_LOCAL_DELEGATED);`,
			);
		}
	};

	afterEach(() => {
		fs.rmSync(projectDir, { recursive: true, force: true });
	});

	const runCli = (
		args: string[] = ["--version"],
		envOverrides: { [key: string]: string } = {},
	) => {
		const env: any = { ...process.env, ...envOverrides };
		delete env.NS_CLI_LOCAL_DELEGATED;
		delete env.NS_CLI_NO_LOCAL;
		for (const key of Object.keys(envOverrides)) {
			env[key] = envOverrides[key];
		}
		return spawnSync(process.execPath, [cliEntry, ...args], {
			cwd: projectDir,
			encoding: "utf8",
			env,
		});
	};

	it("hands off to a project-local install, marking the delegated process", () => {
		makeProject({ localCli: true });

		const result = runCli();

		assert.include(result.stdout, `${LOCAL_MARKER} delegated=1`);
		assert.include(result.stderr, "project-local nativescript@99.0.0-local");
		assert.notInclude(result.stdout, ownVersion);
	});

	it("runs the invoked copy when the project has no local install", () => {
		makeProject();

		const result = runCli();

		assert.include(result.stdout, ownVersion);
		assert.notInclude(result.stdout, LOCAL_MARKER);
		assert.notInclude(result.stderr, "project-local");
	});

	it("does not delegate to a symlink of the same copy (npm link)", () => {
		makeProject({ symlinkToOwnCopy: true });

		const result = runCli();

		assert.include(result.stdout, ownVersion);
		assert.notInclude(result.stderr, "project-local");
	});

	it("--no-local-cli opts out and is stripped before option parsing", () => {
		makeProject({ localCli: true });

		const result = runCli(["--version", "--no-local-cli"]);

		assert.include(result.stdout, ownVersion);
		assert.notInclude(result.stdout, LOCAL_MARKER);
	});

	it("NS_CLI_NO_LOCAL opts out", () => {
		makeProject({ localCli: true });

		const result = runCli(["--version"], { NS_CLI_NO_LOCAL: "1" });

		assert.include(result.stdout, ownVersion);
		assert.notInclude(result.stdout, LOCAL_MARKER);
	});

	it("a delegated process never delegates again", () => {
		makeProject({ localCli: true });

		const result = runCli(["--version"], { NS_CLI_LOCAL_DELEGATED: "1" });

		assert.include(result.stdout, ownVersion);
		assert.notInclude(result.stdout, LOCAL_MARKER);
	});
});
