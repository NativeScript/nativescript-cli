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
	Command,
	defineCommand,
	defineOptions,
	numberOption,
	stringOption,
} from "../../lib/common/define-command";
import type { CommandParamValues } from "../../lib/common/define-command";
import {
	registerBuiltInCommand,
	registerLazyCommand,
} from "../../lib/common/services/command-definition-adapter";
import type { Injector } from "../../lib/common/di/injector";
import { inject } from "../../lib/common/di/inject";

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
		device: stringOption({ required: true }),
		count: numberOption({ required: true }),
	},
	run(ctx) {
		expectExactType<IsExact<typeof ctx.options.device, string>>();
		expectExactType<IsExact<typeof ctx.options.count, number>>();
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
	name: "typefixture|bad-params",
	// @ts-expect-error - `params` is a closed set
	params: "one",
	run: () => undefined,
});

// `params` accepts positional specs, and `ctx.params` keys the values by
// the declared names. The keys are not inferred from the spec array — the
// value type is what the declaration pins.
defineCommand({
	name: "typefixture|positional",
	params: [
		{ name: "platform", required: true },
		{ name: "extra", variadic: true },
	],
	run(ctx) {
		expectExactType<IsExact<typeof ctx.params, CommandParamValues>>();
		expectExactType<
			IsExact<(typeof ctx.params)["platform"], string | string[]>
		>();
	},
});

defineCommand({
	name: "typefixture|bad-argument-spec",
	// @ts-expect-error - an argument spec is a closed shape
	params: [{ name: "platform", requried: true }],
	run: () => undefined,
});

defineCommand({
	name: "typefixture|validate",
	options: { force: booleanOption({ default: false }) },
	params: [
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

// A lazy registration is only checked when the call site names the type of the
// definition it loads: `require()` is `any`, so nothing infers from the loader.
declare const require: (id: string) => any;

const lazyPlatform = defineCommand({
	name: "typefixture|lazy-ios",
	run: () => undefined,
});

const lazyAliases = defineCommand({
	name: ["typefixture|lazy-vision", "typefixture|lazy-visionos"],
	run: () => undefined,
});

registerLazyCommand<typeof lazyPlatform>(
	"typefixture|lazy-ios",
	() => require("./commands/lazy").lazyPlatform,
);

registerLazyCommand<typeof lazyPlatform>(
	// @ts-expect-error - the definition loaded declares 'typefixture|lazy-ios'
	"typefixture|lazy-iosss",
	() => require("./commands/lazy").lazyPlatform,
);

registerLazyCommand<typeof lazyAliases>(
	"typefixture|lazy-visionos",
	() => require("./commands/lazy").lazyAliases,
);

registerLazyCommand<typeof lazyAliases>(
	// @ts-expect-error - not one of the names the definition declares
	"typefixture|lazy-vision2",
	() => require("./commands/lazy").lazyAliases,
);

registerLazyCommand<
	// @ts-expect-error - the loader must point at a defineCommand() definition
	typeof setupLazyCommand
>("typefixture|lazy-ios", () => require("./commands/lazy").setupLazyCommand);

// Omitting the type argument checks nothing, so the name parameter turns into
// the instruction to pass one.
registerLazyCommand(
	// @ts-expect-error - the definition's type must be passed explicitly
	"typefixture|lazy-ios",
	() => require("./commands/lazy").lazyPlatform,
);

registerLazyCommand(
	// @ts-expect-error - a name no definition backs is still not enough
	"typefixture|lazy-anything",
	() => require("./commands/lazy").lazyPlatform,
);

declare function setupLazyCommand(): { projectDir: string };

// The class form types this.options, this.args and this.context off the schema
// the meta declares, exactly as the object form types ctx.
class TypefixturePlatformClean extends Command({
	name: "typefixture|class-clean",
	options: {
		frameworkPath: stringOption({ default: "platforms" }),
		verbose: booleanOption(),
	},
	params: "any",
}) {
	run(): void {
		const frameworkPath = this.options.frameworkPath;
		const verbose = this.options.verbose;
		const args = this.args;
		const fail = this.context.fail;

		expectExactType<IsExact<typeof frameworkPath, string>>();
		expectExactType<IsExact<typeof verbose, boolean | undefined>>();
		expectExactType<IsExact<typeof args, string[]>>();
		expectExactType<IsExact<ReturnType<typeof fail>, never>>();

		// @ts-expect-error - the schema types this.options and nothing else
		this.options.undeclared;
	}
}

// The result type is inferred from run; postRun receives it without the
// class restating it.
class TypefixtureResult extends Command({ name: "typefixture|class-result" }) {
	run() {
		return 1;
	}

	postRun(result: number): void {
		expectExactType<IsExact<typeof result, number>>();
	}
}

class TypefixtureResultMismatch extends Command({
	name: "typefixture|class-result-mismatch",
}) {
	run() {
		return 1;
	}

	// @ts-expect-error - run returns a number, so postRun cannot take a string
	postRun(result: string): void {
		return undefined;
	}
}

class TypefixtureAsyncResult extends Command({
	name: "typefixture|class-async-result",
}) {
	async run() {
		return { created: true, path: "/tmp/app" };
	}

	postRun(result: { created: boolean; path: string }): void {
		return undefined;
	}
}

class TypefixtureAsyncResultMismatch extends Command({
	name: "typefixture|class-async-result-mismatch",
}) {
	async run() {
		return { created: true };
	}

	// @ts-expect-error - postRun receives the awaited object, not a string flag
	postRun(result: { created: string }): void {
		return undefined;
	}
}

// @ts-expect-error - run is abstract; a command class has to implement it
class TypefixtureNoRun extends Command({ name: "typefixture|class-no-run" }) {}

// The static definition is what a registration site is checked against, so the
// literal name has to survive from the meta through to the call.
registerBuiltInCommand<typeof TypefixturePlatformClean>(
	"typefixture|class-clean",
	() => require("./commands/clean").TypefixturePlatformClean,
);

registerBuiltInCommand<typeof TypefixturePlatformClean>(
	// @ts-expect-error - the class declares 'typefixture|class-clean'
	"typefixture|class-cleann",
	() => require("./commands/clean").TypefixturePlatformClean,
);

class TypefixtureAliased extends Command({
	name: ["typefixture|class-vision", "typefixture|class-visionos"],
}) {
	run(): void {
		return undefined;
	}
}

registerLazyCommand<typeof TypefixtureAliased>(
	"typefixture|class-visionos",
	() => require("./commands/clean").TypefixtureAliased,
);

registerLazyCommand<typeof TypefixtureAliased>(
	// @ts-expect-error - not one of the names the class declares
	"typefixture|class-vision2",
	() => require("./commands/clean").TypefixtureAliased,
);

// An option group types its values off the same declaration at both ends: the
// command's ctx.options and whatever injects the group.
const TypefixtureRunOptions = defineOptions("typefixture-run", {
	watch: booleanOption({ default: true }),
	device: stringOption(),
});

defineCommand({
	name: "typefixture|group",
	options: [
		TypefixtureRunOptions,
		{ extra: booleanOption({ default: false }) },
	],
	run(ctx) {
		expectExactType<IsExact<typeof ctx.options.watch, boolean>>();
		expectExactType<IsExact<typeof ctx.options.device, string | undefined>>();
		expectExactType<IsExact<typeof ctx.options.extra, boolean>>();

		const injected = inject(TypefixtureRunOptions);
		expectExactType<IsExact<typeof injected.watch, boolean>>();
		expectExactType<IsExact<typeof injected.device, string | undefined>>();
		// @ts-expect-error - the group's values hold the group's own keys only
		injected.extra;

		// @ts-expect-error - neither the group nor the inline specs declare it
		ctx.options.undeclared;
	},
});

class TypefixtureGroupClass extends Command({
	name: "typefixture|class-group",
	options: [
		TypefixtureRunOptions,
		{ extra: booleanOption({ default: false }) },
	],
}) {
	run(): void {
		expectExactType<IsExact<typeof this.options.watch, boolean>>();
		expectExactType<IsExact<typeof this.options.device, string | undefined>>();
		expectExactType<IsExact<typeof this.options.extra, boolean>>();

		// @ts-expect-error - neither the group nor the inline specs declare it
		this.options.undeclared;
	}
}
