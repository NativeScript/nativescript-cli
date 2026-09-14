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
import type { CommandArgumentValues } from "../../lib/common/define-command";
import type { Injector } from "../../lib/common/di/injector";

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
		// `never` is what lets fail() end a branch without a return.
		expectExactType<IsExact<ReturnType<typeof ctx.fail>, never>>();

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

// `arguments` accepts positional specs, and `ctx.arguments` keys the values by
// the declared names. The keys are not inferred from the spec array — the
// value type is what the declaration pins.
defineCommand({
	name: "typefixture|positional",
	arguments: [
		{ name: "platform", required: true },
		{ name: "extra", variadic: true },
	],
	run(ctx) {
		expectExactType<IsExact<typeof ctx.arguments, CommandArgumentValues>>();
		expectExactType<
			IsExact<(typeof ctx.arguments)["platform"], string | string[]>
		>();
	},
});

defineCommand({
	name: "typefixture|bad-argument-spec",
	// @ts-expect-error - an argument spec is a closed shape
	arguments: [{ name: "platform", requried: true }],
	run: () => undefined,
});

defineCommand({
	name: "typefixture|validate",
	options: { force: booleanOption({ default: false }) },
	arguments: [
		{
			name: "platform",
			validate(value, ctx) {
				expectExactType<IsExact<typeof value, string>>();
				expectExactType<IsExact<typeof ctx.options.force, boolean>>();
				return value.length > 0;
			},
		},
	],
	run: () => undefined,
});

// The injector is the escape hatch for lookups after the first await.
defineCommand({
	name: "typefixture|injector",
	run(ctx) {
		expectExactType<IsExact<typeof ctx.injector, Injector>>();
	},
});

// setup flows into canExecute, run and postRun; run's value flows into postRun.
defineCommand({
	name: "typefixture|lifecycle",
	async setup() {
		return { projectDir: "app" };
	},
	canExecute(ctx, setupResult) {
		expectExactType<IsExact<typeof setupResult, { projectDir: string }>>();
		return true;
	},
	async run(ctx, setupResult) {
		expectExactType<IsExact<typeof setupResult, { projectDir: string }>>();
		return setupResult.projectDir.length;
	},
	postRun(ctx, result, setupResult) {
		expectExactType<IsExact<typeof result, number>>();
		expectExactType<IsExact<typeof setupResult, { projectDir: string }>>();
	},
});

// A synchronous setup and a synchronous run land on the same types.
defineCommand({
	name: "typefixture|lifecycle-sync",
	setup: () => "ready",
	run(ctx, setupResult) {
		expectExactType<IsExact<typeof setupResult, string>>();
		return true;
	},
	postRun(ctx, result) {
		expectExactType<IsExact<typeof result, boolean>>();
	},
});

// Without a setup, the second parameter is void — there is nothing to read.
defineCommand({
	name: "typefixture|no-setup",
	run(ctx, setupResult) {
		expectExactType<IsExact<typeof setupResult, void>>();
	},
});

defineCommand({
	name: "typefixture|unknown-options",
	allowUnknownOptions: true,
	run: () => undefined,
});

defineCommand({
	name: "typefixture|bad-unknown-options",
	// @ts-expect-error - allowUnknownOptions is a boolean
	allowUnknownOptions: "yes",
	run: () => undefined,
});
