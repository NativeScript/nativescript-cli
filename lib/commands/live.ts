import { IChildProcess } from "../common/declarations";
import { Command } from "../common/define-command";
import { inject } from "../common/di";

const LIVE_CLI_PACKAGE = "@nativescript/cloudflare-cli";

export class LiveCommand extends Command({
	name: "live",
	description:
		"Creates a live project on preview.nativescript.org, opens its browser IDE and runs it on your phone or this Mac.",
	// The flags belong to the live CLI (--mac, --electron, --new, ...), which
	// gets the raw command line.
	params: "any",
	allowUnknownOptions: true,
}) {
	private $childProcess = inject<IChildProcess>("childProcess");

	public async run(): Promise<void> {
		const commandArgs = process.argv.slice(process.argv.indexOf("live") + 1);
		// Needs no project, so it runs the live CLI through npx instead of installing it into one.
		const child = this.$childProcess.spawn(
			"npx",
			["--yes", `${LIVE_CLI_PACKAGE}@latest`, "live", ...commandArgs],
			// npx is a .cmd script on Windows, which Node only spawns through a shell.
			{ stdio: "inherit", shell: process.platform === "win32" },
		);
		const code = await new Promise<number>((resolve, reject) => {
			child.on("error", reject);
			child.on("close", (exitCode: number | null) => resolve(exitCode ?? 1));
		});
		if (code !== 0) {
			this.context.fail(`ns live exited with code ${code}.`, { help: false });
		}
	}
}
