import * as path from "path";
import * as fs from "fs";
import { IChildProcess } from "../common/declarations";

/** `linux` options of nativescript.config that shape release packaging. */
export interface LinuxBundleConfig {
	bundle?: boolean;
	bundleUnpack?: string[];
	sourceProtect?: boolean;
	fuses?: {
		bundleIntegrity?: boolean;
		onlyLoadAppFromBundle?: boolean;
		inspector?: boolean;
		envOverrides?: boolean;
	};
}

export interface LinuxBundleOptions {
	/** staged folder: the executable, app/ */
	stage: string;
	executable: string;
	/** runtime package tools (ns-bundle) */
	toolsDir: string;
	config: LinuxBundleConfig;
	/** --source-protect / --no-source-protect */
	sourceProtect?: boolean;
	/** --source-protect-key-hex or $NS_LINUX_BUNDLE_KEY */
	keyHex?: string;
}

const onOff = (on: boolean) => (on ? "on" : "off");

/**
 * Release packaging: app/ into app.nsbundle (sealed for source protection) and the executable's
 * fuses. Bundling problems only warn; failed source protection throws, so sources never ship readable by mistake.
 */
export class LinuxAppBundler {
	constructor(
		private $childProcess: IChildProcess,
		private $logger: ILogger,
	) {}

	public async pack(options: LinuxBundleOptions): Promise<void> {
		const { stage, executable, toolsDir, config } = options;
		const seal = options.sourceProtect ?? config.sourceProtect ?? false;
		const bundle = seal || config.bundle !== false;
		const tool = process.env.NS_BUNDLE_TOOL || path.join(toolsDir, "ns-bundle");
		const fuses = config.fuses ?? {};
		const fuseArgs = (bundled: boolean) =>
			(
				[
					["bundleIntegrity", fuses.bundleIntegrity ?? bundled],
					["onlyLoadAppFromBundle", fuses.onlyLoadAppFromBundle ?? bundled],
					["inspector", fuses.inspector ?? false],
					["envOverrides", fuses.envOverrides ?? false],
				] as [string, boolean][]
			).flatMap(([name, on]) => ["--fuse", `${name}=${onOff(on)}`]);

		if (!fs.existsSync(tool)) {
			const message = `This Linux runtime has no ns-bundle tool (${tool}), the app ships as a plain folder.`;
			if (seal) {
				throw new Error(`Source protection failed: ${message}`);
			}
			if (bundle) {
				this.$logger.warn(message);
			}
			return;
		}

		if (!bundle) {
			try {
				await this.run(tool, ["fuses", executable, ...fuseArgs(false)], stage);
			} catch (e) {
				this.$logger.warn(`Couldn't set the runtime fuses: ${e.message}`);
			}
			return;
		}

		const app = path.join(stage, "app");
		const output = path.join(stage, "app.nsbundle");
		const unpacked = `${output}.unpacked`;
		const args = [
			"pack",
			"--input",
			app,
			"--output",
			output,
			"--exe",
			executable,
		];
		if (config.bundleUnpack) {
			args.push("--no-default-unpack");
			for (const glob of config.bundleUnpack) {
				args.push("--unpack", glob);
			}
		}
		let env: NodeJS.ProcessEnv | undefined;
		if (seal) {
			args.push("--seal");
			if (options.keyHex) {
				// argv is readable by every local user; older tools only take --key-hex
				if (await this.readsKeyFromEnv(tool, stage)) {
					env = { ...process.env, NS_BUNDLE_KEY_HEX: options.keyHex };
				} else {
					args.push("--key-hex", options.keyHex);
				}
			}
		}
		args.push(...fuseArgs(true));
		// the tool only patches the executable once the bundle is written
		const pristine = fs.readFileSync(executable);
		try {
			const result = await this.run(tool, args, stage, env);
			this.$logger.info(result.stdout.trim());
		} catch (e) {
			for (const p of [output, unpacked]) {
				fs.rmSync(p, { recursive: true, force: true });
			}
			fs.writeFileSync(executable, pristine);
			if (seal) {
				throw new Error(`Source protection failed: ${e.message}`);
			}
			this.$logger.warn(
				`Couldn't pack app.nsbundle, the app ships as a plain folder: ${e.message}`,
			);
			return;
		}
		// app/ is served from the bundle; as a link to the unpacked files, paths native
		// code builds from the app folder (fonts, addons) still open
		fs.rmSync(app, { recursive: true, force: true });
		fs.symlinkSync(path.basename(unpacked), app);
		this.$logger.info(
			`Packed the app into ${output}${seal ? " (source protected)" : ""}.`,
		);
	}

	private async readsKeyFromEnv(tool: string, cwd: string) {
		try {
			const help = await this.run(tool, ["--help"], cwd);
			return help.stdout.includes("NS_BUNDLE_KEY_HEX");
		} catch {
			return false;
		}
	}

	private async run(
		command: string,
		args: string[],
		cwd: string,
		env?: NodeJS.ProcessEnv,
	) {
		const result = await this.$childProcess.spawnFromEvent(
			command,
			args,
			"close",
			env ? { cwd, env } : { cwd },
			{ throwError: false },
		);
		if (result.exitCode !== 0) {
			throw new Error(
				`${path.basename(command)} failed (exit code ${result.exitCode}): ${(result.stderr || result.stdout).trim()}`,
			);
		}
		return result;
	}
}
