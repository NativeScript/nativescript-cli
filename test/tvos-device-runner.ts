import { assert } from "chai";
import * as fs from "fs/promises";
import * as path from "path";
import {
	selectAppleTV,
	TvOSDeviceRunner,
} from "../lib/services/tvos-device-runner";

const tv = {
	identifier: "core-id",
	hardwareProperties: { deviceType: "appleTV", udid: "hardware-id" },
	deviceProperties: { name: "Living Room" },
	connectionProperties: { pairingState: "paired" },
};

describe("tvOS CoreDevice transport", () => {
	it("matches paired TVs by either identifier or case-insensitive name", () => {
		for (const name of ["core-id", "hardware-id", "LIVING ROOM"])
			assert.strictEqual(selectAppleTV([tv], name), tv);
	});
	it("does not claim simulators, phones, or unpaired devices", () => {
		assert.isUndefined(selectAppleTV([tv], "sim-id"));
		assert.isUndefined(
			selectAppleTV(
				[{ ...tv, hardwareProperties: { deviceType: "iPhone" } }],
				"core-id",
			),
		);
		assert.isUndefined(
			selectAppleTV(
				[{ ...tv, connectionProperties: { pairingState: "unpaired" } }],
				"core-id",
			),
		);
	});
	it("requires an identifier when names are ambiguous", () => {
		assert.throws(
			() =>
				selectAppleTV([tv, { ...tv, identifier: "second-id" }], "Living Room"),
			/Multiple paired/,
		);
	});
	function fixture(options: any = {}, launchError?: Error) {
		const commands: Array<{ file: string; args: string[] }> = [];
		let buildOptions: any;
		const child = {
			execFile: async (file: string, args: string[]) => {
				commands.push({ file, args });
				if (args[0] === "devicectl" && args[1] === "list")
					await fs.writeFile(
						args[args.length - 1],
						JSON.stringify({ result: { devices: [tv] } }),
					);
				if (file === "/usr/bin/unzip")
					await fs.mkdir(path.join(args[3], "Payload", "Test.app"), {
						recursive: true,
					});
				if (args.includes("launch") && launchError) throw launchError;
			},
		};
		const runner = new TvOSDeviceRunner(
			child as any,
			{
				device: "hardware-id",
				watch: false,
				argv: { release: true },
				...options,
			} as any,
			{ prepareAndBuild: async () => "/test/app.ipa" } as any,
			{
				getBuildData: (_dir: string, _platform: string, opts: any) => {
					buildOptions = opts;
					return opts;
				},
			} as any,
			{
				getProjectData: () => ({
					projectDir: "/test",
					projectIdentifiers: { tvos: "org.test.tv" },
				}),
			} as any,
			{ info: () => {}, trace: () => {}, error: () => {} } as any,
		);
		return { runner, commands, getBuildOptions: () => buildOptions };
	}
	it("leaves simulator and implicit selection to the existing runner", async () => {
		for (const options of [{ emulator: true }, { device: undefined as string }]) {
			const f = fixture(options);
			assert.isFalse(await f.runner.tryRun());
			assert.isEmpty(f.commands);
		}
	});
	it("builds a signed device archive, installs and launches using the CoreDevice ID", async () => {
		const f = fixture();
		assert.isTrue(await f.runner.tryRun());
		assert.include(f.getBuildOptions(), {
			release: true,
			emulator: false,
			buildForDevice: true,
			hmr: false,
			watch: false,
		});
		const install = f.commands.find((c) => c.args.includes("install"))!;
		assert.include(install.args, "core-id");
		const launch = f.commands.find((c) => c.args.includes("launch"))!;
		assert.deepEqual(launch.args.slice(-3), [
			"core-id",
			"--terminate-existing",
			"org.test.tv",
		]);
		for (const c of f.commands) {
			if (c.file === "/usr/bin/unzip")
				assert.isFalse(
					await fs.stat(c.args[3]).then(
						() => true,
						() => false,
					),
				);
		}
	});
	it("propagates an asleep-device launch failure and removes extracted artifacts", async () => {
		const f = fixture({}, new Error("System is asleep"));
		try {
			await f.runner.tryRun();
			assert.fail("must reject");
		} catch (error) {
			assert.match(String(error), /System is asleep/);
		}
		const extraction = f.commands.find((c) => c.file === "/usr/bin/unzip")!
			.args[3];
		assert.isFalse(
			await fs.stat(extraction).then(
				() => true,
				() => false,
			),
		);
	});
});
