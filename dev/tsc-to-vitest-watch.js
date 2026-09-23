// Run "tsc" in watch mode alongside vitest. Vitest runs the compiled output,
// so on its own it never notices a .ts edit - tsc has to re-emit first, and
// vitest picks the change up from there.

const { spawn } = require("child_process");

// shell: true so the node_modules/.bin shims resolve on Windows as well
const spawnOptions = { stdio: "inherit", shell: true };

const children = [
	// --preserveWatchOutput keeps tsc from clearing the screen and wiping the
	// test results out from under you on every recompile
	spawn("tsc", ["--watch", "--preserveWatchOutput"], spawnOptions),
	// --watch explicitly: vitest only infers watch mode when stdout is a TTY,
	// and would otherwise run once and exit, taking tsc down with it
	spawn("vitest", ["--watch"], spawnOptions),
];

let shuttingDown = false;

function shutdown() {
	if (shuttingDown) {
		return;
	}
	shuttingDown = true;
	for (const child of children) {
		child.kill("SIGINT");
	}
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

for (const child of children) {
	// if either side dies, don't leave the other running in the background
	child.on("exit", shutdown);
}
