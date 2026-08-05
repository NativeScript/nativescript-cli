/**
 * Type-level assertions for the defineCommand schema, compiled by
 * test/define-command.ts through this directory's tsconfig. It is kept out of
 * the repo's own build because that build runs without strictNullChecks, which
 * erases the `| undefined` these assertions exist to pin — and because the
 * @ts-expect-error directives below only hold under strict mode.
 */

import {
	arrayOption,
	booleanOption,
	defineCommand,
	numberOption,
	stringOption,
} from "../../lib/common/define-command";

type IsExact<A, B> =
	(<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
		? true
		: false;

const expectExactType = <T extends true>(): void => undefined;

// A declared option is `T` only when the schema supplies a default; without
// one the flag may simply be absent from the command line.
defineCommand({
	name: "typefixture|values",
	options: {
		verbose: booleanOption(),
		release: booleanOption({ default: false }),
		output: stringOption({ alias: "o" }),
		target: stringOption({ default: "dist" }),
		retries: numberOption(),
		attempts: numberOption({ default: 3 }),
		files: arrayOption(),
		tags: arrayOption({ default: [] }),
	},
	run(ctx) {
		expectExactType<IsExact<typeof ctx.options.verbose, boolean | undefined>>();
		expectExactType<IsExact<typeof ctx.options.release, boolean>>();
		expectExactType<IsExact<typeof ctx.options.output, string | undefined>>();
		expectExactType<IsExact<typeof ctx.options.target, string>>();
		expectExactType<IsExact<typeof ctx.options.retries, number | undefined>>();
		expectExactType<IsExact<typeof ctx.options.attempts, number>>();
		expectExactType<IsExact<typeof ctx.options.files, string[] | undefined>>();
		expectExactType<IsExact<typeof ctx.options.tags, string[]>>();
		expectExactType<IsExact<typeof ctx.args, string[]>>();

		// @ts-expect-error - the schema types ctx.options and nothing else
		ctx.options.undeclared;
	},
});

defineCommand({
	name: "typefixture|no-options",
	run(ctx) {
		expectExactType<IsExact<typeof ctx.args, string[]>>();

		// @ts-expect-error - nothing is declared, so any access is a typo
		ctx.options.anything;
	},
});

defineCommand({
	name: "typefixture|refine",
	options: { force: booleanOption({ default: false }) },
	canExecute(ctx) {
		expectExactType<IsExact<typeof ctx.options.force, boolean>>();
		return ctx.args.length === 1;
	},
	run: () => undefined,
});

// @ts-expect-error - `run` is the required handler field
defineCommand({ name: "typefixture|no-run" });

defineCommand({
	name: "typefixture|bad-arguments",
	// @ts-expect-error - `arguments` is a closed set
	arguments: "one",
	run: () => undefined,
});
