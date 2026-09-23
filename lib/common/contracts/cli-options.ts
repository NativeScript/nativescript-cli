import { booleanOption, defineOptions, stringOption } from "../define-command";

/**
 * The process-level options: parsed once at startup, before a command is
 * chosen, and read by the services that run for every command — the logger,
 * analytics, project resolution. Provided at the root, so any service injects
 * it. Its spellings are protected: a command may not redeclare one.
 */
export const CliOptions = defineOptions("cli", {
	log: stringOption(),
	verbose: booleanOption(),
	version: booleanOption({ alias: "v" }),
	help: booleanOption({ alias: "h" }),
	profileDir: stringOption({ hasSensitiveValue: true }),
	analyticsClient: stringOption(),
	path: stringOption({ alias: "p", hasSensitiveValue: true }),
	config: stringOption({ alias: "c", hasSensitiveValue: true }),
});
