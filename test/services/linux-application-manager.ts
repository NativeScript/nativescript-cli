import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { assert } from "chai";
import { LinuxApplicationManager } from "../../lib/common/mobile/linux/linux-application-manager";
import * as stubs from "../stubs";

const isLinux = process.platform === "linux";

function waitFor(check: () => boolean, ms = 5000): Promise<void> {
	const deadline = Date.now() + ms;
	return new Promise((resolve, reject) => {
		const tick = () => {
			if (check()) return resolve();
			if (Date.now() > deadline) return reject(new Error("timed out"));
			setTimeout(tick, 20);
		};
		tick();
	});
}

describe.runIf(isLinux)("LinuxApplicationManager", () => {
	let dir: string;
	let lines: string[];
	let manager: LinuxApplicationManager;

	beforeEach(() => {
		dir = fs.mkdtempSync(path.join(os.tmpdir(), "ns-linux-app-"));
		lines = [];
		const logProvider = <any>{
			logData: (line: string) => lines.push(line),
			setSourceFileLocation: async () => {},
		};
		manager = new LinuxApplicationManager(
			new stubs.LoggerStub(),
			<any>{},
			logProvider,
			"host",
		);
	});

	afterEach(async () => {
		await manager.stopApplication(<any>{});
		fs.rmSync(dir, { recursive: true, force: true });
	});

	function app(script: string): string {
		// stands in for the runtime: prints its args, reacts to SIGUSR1
		const executable = path.join(dir, "demo");
		fs.writeFileSync(executable, `#!/bin/sh\n${script}\n`);
		return executable;
	}

	it("runs the installed executable and forwards its output", async () => {
		await manager.installApplication(
			app('echo "args:$*"; echo oops >&2; sleep 30'),
			"org.demo",
		);
		assert.isTrue(await manager.isApplicationInstalled("org.demo"));
		await manager.startApplication(<any>{
			appId: "org.demo",
			projectName: "demo",
			debugMode: true,
		});
		await waitFor(() => lines.length >= 2);
		assert.includeMembers(lines, [
			`args:--inspect=${manager.inspectorPort}`,
			"oops",
		]);
		assert.isTrue(manager.isRunning());
		await manager.stopApplication(<any>{});
		assert.isFalse(manager.isRunning());
	});

	it("signals the running app to apply livesync changes", async () => {
		await manager.installApplication(
			app(
				'trap "echo synced" USR1; echo ready; while true; do sleep 0.05; done',
			),
			"org.demo",
		);
		assert.isFalse(manager.signalLiveSync());
		await manager.startApplication(<any>{
			appId: "org.demo",
			projectName: "demo",
		});
		await waitFor(() => lines.includes("ready"));
		assert.isTrue(manager.signalLiveSync());
		await waitFor(() => lines.includes("synced"));
	});

	it("runs the staged executable of a release archive", async () => {
		const staged = path.join(dir, "demo");
		fs.mkdirSync(staged);
		fs.writeFileSync(path.join(staged, "demo"), "#!/bin/sh\necho release\n");
		const archive = path.join(dir, "demo.tar.gz");
		fs.writeFileSync(archive, "not a script");
		await manager.installApplication(archive, "org.demo");
		assert.equal(fs.statSync(archive).mode & 0o111, 0);
		await manager.startApplication(<any>{
			appId: "org.demo",
			projectName: "demo",
		});
		await waitFor(() => lines.includes("release"));
	});

	it("fails to start an app that wasn't built", async () => {
		let error: Error;
		try {
			await manager.startApplication(<any>{
				appId: "missing",
				projectName: "missing",
			});
		} catch (err) {
			error = err;
		}
		assert.include(error?.message, "ns build linux");
	});
});
