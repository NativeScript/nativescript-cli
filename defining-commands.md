Defining Commands
=================

`defineCommand` is the declarative way to add a command to the NativeScript
CLI. A definition is a plain object: a name, an option schema, and a `run`
function. The CLI compiles it into the command shape its registry expects, so a
definition gets the same option parsing, hooks, analytics and help wiring as a
hand-written command class — without a class, a constructor, or an
`allowedParameters` array.

This is purely additive. The legacy `ICommand` classes registered through
`$injector.registerCommand` keep working exactly as before, and the two styles
coexist in the same registry.

At a glance
-----------

```ts
import {
	defineCommand,
	booleanOption,
	stringOption,
} from "nativescript/contracts";

export default defineCommand({
	name: "widget|add",
	description: "Adds a widget to the project",
	options: {
		overwrite: booleanOption({ default: false }),
		output: stringOption({ alias: "o" }),
	},
	arguments: "any",
	async run(ctx) {
		// ctx.args    -> string[] of positional arguments
		// ctx.options -> { overwrite: boolean; output: string | undefined }
		if (ctx.options.output) {
			console.log(`adding ${ctx.args.join(", ")} to ${ctx.options.output}`);
		}
	},
});
```

`defineCommand` validates the definition and returns it, tagged with a marker
symbol so that any copy of the CLI can recognise it. `isCommandDefinition(value)`
is the exported check, and it narrows to `DefinedCommand`. The tag survives a
spread, so `{ ...baseDefinition, name: "widget|add2" }` is still recognised.

`defineCommand` does not register anything by itself — see
[Registering a definition](#registering-a-definition).

Validation happens where you can see it
---------------------------------------

A definition is checked at the moment `defineCommand` is called, not when the
command eventually runs. A misspelled field, a missing `run`, an option
declared with something other than the four helpers, an `arguments` value
outside `"none" | "any"` — each throws immediately, naming the command and the
accepted form:

```
Invalid command definition for 'widget|add': unknown field(s) 'handler'; a
definition accepts name, description, options, arguments, allowUnknownOptions,
canExecute, disableAnalytics, enableHooks, setup, run, postRun. Accepted form:
defineCommand({ name: "widget|add", run(ctx) { ... } }) — with the optional
fields description, options, arguments, allowUnknownOptions, setup, canExecute,
postRun, disableAnalytics and enableHooks.
```

Names and the command hierarchy
-------------------------------

`name` is either a single string or an array of strings, in which case every
entry becomes an alias for the same command.

The CLI's command registry is flat; the hierarchy the user types on the command
line is encoded in the name with a `|` separator. `"widget|add"` is the command
invoked as `ns widget add`, and `"widget|template|list"` is `ns widget template
list`. Registering a hierarchical name automatically synthesises the parent
dispatcher (`widget`), which routes to the right subcommand or prints help.

A leading `*` on the last segment marks a **default subcommand**: `"widget|*add"`
runs both for `ns widget add` and for a bare `ns widget`. This is the convention
the CLI's own commands use (`run|*all`, `debug|*all`); the encoding is
user-visible because it feeds shell autocompletion and generated help.

A parent name cannot also be a command of its own. If `widget` is already
registered as a flat command, registering `widget|add` leaves that command in
place, warns naming both, and creates no dispatcher — so `ns widget add` will
not route until one of the two is renamed.

Options
-------

`options` is a schema keyed by the long option name — `output` is passed as
`--output`. Declare each entry with one of the four helpers, which fix the
value type:

| Helper          | Declared with `default` | Declared without        |
| --------------- | ----------------------- | ----------------------- |
| `booleanOption` | `boolean`               | `boolean \| undefined`  |
| `stringOption`  | `string`                | `string \| undefined`   |
| `numberOption`  | `number`                | `number \| undefined`   |
| `arrayOption`   | `string[]`              | `string[] \| undefined` |

The two columns are the whole story of the option types: a flag the user did
not pass is absent at runtime, so only a `default` makes the value on
`ctx.options` always present. Declare a default whenever there is a sensible
one and the `| undefined` disappears from the type.

Each helper takes an optional spec:

```ts
options: {
	// --release, absent means false
	release: booleanOption({ default: false }),
	// --output <dir>, also accepted as -o <dir>
	output: stringOption({ alias: "o", description: "Output directory" }),
	// --retries <n>
	retries: numberOption({ default: 3 }),
	// --file a.ts --file b.ts
	file: arrayOption(),
	// kept out of analytics and logs
	token: stringOption({ hasSensitiveValue: true }),
}
```

- `default` — value used when the flag is absent.
- `alias` — single-dash shorthand, or an array of them (`alias: ["o", "out"]`).
- `hasSensitiveValue` — defaults to `false`; set it for anything that must not
  be recorded. There is no reason not to be explicit about credentials, paths
  containing user directories, and tokens.
- `description` — reserved for generated help. It reaches the option parser but
  nothing renders it yet.

The schema types `ctx.options` and nothing else: `ctx.options` carries exactly
the declared keys, and a typo is a compile error. There is deliberately no
"give me everything" escape hatch — a command declares every option it reads,
CLI-wide ones (`--release`, `--path`, `--bundle`, …) included. Declaring one
that the CLI already knows is supported and carries its value through to
`ctx.options` exactly as a command-specific one does.

### Sharing a schema between commands

Extract the schema with `satisfies` rather than a type annotation. An
annotation widens every entry back to the general spec type and the `default`
information — and with it the non-optional value types — is lost:

```ts
const buildOptions = {
	release: booleanOption({ default: false }),
	output: stringOption({ alias: "o" }),
} satisfies CommandOptionsSchema;
```

### Redeclaring a CLI-wide option, and shadowing one

`--verbose`, `--path`, `--log`, `--release`, `--env` and friends are declared by
the CLI itself. A command's declaration is merged over the CLI-wide dictionary
for the duration of that command, and that merge is the sanctioned way to give
a global option a per-command default — `watch`, `hmr` and `skipNative` all
carry different defaults on `build`, `prepare`, `deploy` and `test`:

```ts
options: {
	// CLI-wide --watch, but this command defaults it off
	watch: booleanOption({ default: false }),
}
```

So a redeclaration of the same name with the same type is silent. What the CLI
still warns about at registration is a redeclaration that changes what the
spelling *means*:

- a declared option whose name matches a CLI-wide one but whose type differs —
  `verbose: stringOption()` against the CLI's boolean `--verbose`;
- an alias that belongs to a *different* CLI-wide option — `output:
stringOption({ alias: "p" })` steals `--path`'s shorthand. Restating an
  option's own shorthand (`path: stringOption({ alias: "p" })`) is fine.

The merge replaces the CLI-wide entry rather than patching it, so a
redeclaration inherits nothing: restate the `alias` and `hasSensitiveValue` the
global declaration carries if the command still wants them.

### How validation behaves

Option validation is the CLI's existing behaviour, not something the definition
opts into. Before a command runs, the parser is re-primed with that command's
declared options and the command line is re-parsed:

- Declared options are accepted and appear on `ctx.options`.
- An option the CLI does not know — neither global nor declared by this command
  — produces a warning: `The option '<name>' is not supported. This will become
an error in a future release.` The command still runs. Set
  `NS_STRICT_OPTIONS=error` to preview the hard failure, which is what a future
  release will do by default.
- The same staging applies to value-shape violations: a string option passed
  with no value, an array option passed nothing, a single-valued option passed
  twice.

So adding an option is a matter of adding a schema entry; forgetting to declare
one that users pass is a warning today and a failure later, never a silent
`undefined`.

### `allowUnknownOptions`

A command that forwards its command line to a separately installed CLI cannot
know which flags are legitimate, so validating them here would reject the other
CLI's own options. `allowUnknownOptions: true` turns the check off for that
command:

```ts
defineCommand({
	name: "preview",
	allowUnknownOptions: true,
	options: { disableNpmInstall: booleanOption({ default: false }) },
	async run(ctx) {
		/* spawn the other CLI with process.argv */
	},
});
```

It maps onto `skipOptionsValidation` on the compiled command, which means the
CLI never re-primes its parser for this command at all. A command-specific
option therefore never reaches `ctx.options` under this flag — only options the
CLI already knows globally carry values. Reach for it only when forwarding.

Positional arguments
--------------------

`arguments` declares what the command takes after its name:

- `"none"` (the default) — the command accepts no positional arguments. Passing
  any is rejected with `This command doesn't accept parameters.`
- `"any"` — any number of positional arguments is accepted and handed to `run`
  as `ctx.args`.
- an array of specs — each argument is declared, named, and validated.

### Declared arguments

```ts
defineCommand({
	name: "widget|add",
	arguments: [
		{
			name: "platform",
			required: true,
			errorMessage: "Specify the platform to add the widget for.",
			validate: (value) =>
				["android", "ios"].includes(value) ||
				`'${value}' is not a supported platform.`,
		},
		{ name: "template" },
		{ name: "files", variadic: true },
	],
	async run(ctx) {
		ctx.arguments.platform; // "android"
		ctx.arguments.template; // "blank", or absent
		ctx.arguments.files; // string[], possibly empty
	},
});
```

A spec accepts:

- `name` — the key the value appears under on `ctx.arguments`, and the name
  messages use.
- `required` — defaults to false. A required argument may not follow an
  optional one; positional matching would never be able to satisfy it.
- `variadic` — collects every remaining argument as a `string[]`. Must be the
  last spec. A required variadic wants at least one value.
- `description` — reserved for generated help, like an option's.
- `errorMessage` — replaces `Missing required argument '<name>'.` when the
  argument is required and absent.
- `validate(value, ctx)` — run per value, `ctx` being the same context `run`
  receives. Return `true` to accept; return `false` for a default message, or
  return the message itself as a string. It may be `async`.

Enforcement happens before `canExecute`, in this order: missing required
arguments (every missing one is named at once), then too many arguments, then
each `validate`.

### Matching is strictly positional

The first spec takes the first argument, the second spec the second, and so on.
This is a deliberate divergence from the `ICommandParameter` machinery a
hand-written command class uses, where `CommandsService` scans the validators
and lets a mandatory parameter claim whichever argument happens to satisfy it —
so `ns command b a` could satisfy `[a, b]`. Nothing in the CLI depends on that
behaviour, and positional is what the declaration reads like.

The practical consequence: `ctx.arguments.template` is `args[1]` whether or not
`args[1]` looks like a template. An argument that could be several things is a
job for `validate` or for `canExecute`, not for the matcher.

`ctx.arguments` is always present, even with `arguments: "none"` or `"any"` —
it is simply `{}` when no specs are declared. An optional non-variadic argument
the command line did not reach is absent from it; a variadic one is always
there, as an array.

### `canExecute` refines, it does not replace

```ts
defineCommand({
	name: "widget|add",
	arguments: "any",
	async canExecute(ctx) {
		return ctx.args.length === 1;
	},
	async run(ctx) {
		/* ... */
	},
});
```

The two fields compose. The declared `arguments` policy is enforced first, and
`canExecute` is consulted only for command lines that already satisfy it — so a
definition that leaves `arguments` at `"none"` still rejects stray positional
arguments even when it supplies a `canExecute`, and a `canExecute` that only
inspects options cannot accidentally widen what the command accepts.

`canExecute` receives a context of the same shape as `run`'s — the same
`args`, the same declared options and the same `fail` — built freshly for the
call, and returns a boolean (or a promise of one). Returning `false` aborts the
command and prints a bare help suggestion; `ctx.fail(message)` aborts it with
your own message, which is usually the friendlier choice.

`canExecute` runs inside a dependency-injection context, on the same terms as
`run`: `inject()` is valid up to the first `await`.

The run context
---------------

`run(ctx)` receives:

- `ctx.args` — `string[]`, the positional arguments left after the command name
  (including any subcommand segments) has been consumed.
- `ctx.arguments` — the same arguments keyed by the names the `arguments` specs
  declare, `{}` when there are none.
- `ctx.options` — the current value of each declared option, read at the moment
  the command executes.
- `ctx.injector` — the injector this command was registered against; see
  [Injection, and the first `await`](#injection-and-the-first-await).
- `ctx.fail(message)` — fails the command with `message` and a usage help
  suggestion.

`run` may be synchronous or `async`; the CLI awaits the result and treats a
rejection as a command failure.

### Failing a command

`ctx.fail(message)` is the idiomatic way to stop a command:

```ts
defineCommand({
	name: "widget|add",
	arguments: "any",
	options: { output: stringOption() },
	async run(ctx) {
		if (!ctx.options.output) {
			ctx.fail("--output is required.");
		}

		/* ... */
	},
});
```

It is available on the `canExecute` context as well, and it returns `never`, so
it can end a branch without a `return`. The message must be a non-empty string.

Throwing is equivalent and keeps working — `ctx.fail` is sugar over the
`errors` service's `failWithHelp`, which is what adds the "Run `ns widget add
--help`" line. Throw when you already have an `Error` to propagate; call
`ctx.fail` when you are writing the message.

Injection, and the first `await`
--------------------------------

`setup`, `canExecute`, `run` and `postRun` each start inside a
dependency-injection context, so `inject()` works directly:

```ts
import { defineCommand, inject } from "nativescript/contracts";
import { DoctorService } from "nativescript/contracts";

export default defineCommand({
	name: "widget|check",
	async run() {
		const doctorService = inject(DoctorService);
		await doctorService.printWarnings();
	},
});
```

The injection context is synchronous, so **`inject()` is valid up to the first
`await` in a handler, and not after it**. After that first `await`, use
`ctx.injector.get(token)`:

```ts
async run(ctx) {
	const packageManager = inject(PackageManager); // fine, no await yet
	await packageManager.install(name);
	// inject() would throw here
	const platform = ctx.injector.get(PlatformService);
}
```

`ctx.injector` is deliberately the injector itself rather than a bound
`ctx.inject(...)`: it is a visibly different mechanism because it obeys
different rules, and mistaking one for the other is exactly the bug this shape
prevents. It is the injector the command was **registered against**, so it also
resolves providers a child scope supplied — see
[Registering a definition](#registering-a-definition). The same guidance, and
the reasoning behind it, is in `dependency-injection.md`.

`setup` — hoisting work out of `run`
------------------------------------

`setup(ctx)` runs once per invocation, before `canExecute`, and its return
value is handed to `canExecute`, `run` and `postRun` as their second argument:

```ts
export default defineCommand({
	name: "widget|add",
	arguments: "any",
	setup() {
		const projectData = inject(ProjectData);
		projectData.initializeProjectData();
		return { projectData, widgets: inject(WidgetService) };
	},
	canExecute(ctx, { projectData }) {
		return !!projectData.projectDir;
	},
	async run(ctx, { widgets }) {
		await widgets.add(ctx.args);
	},
});
```

It exists for two reasons. It is the place to inject services before the first
`await` when several handlers need them, and it is where the work a command
class used to do in its constructor goes — most often
`$projectData.initializeProjectData()`.

`setup` is sugar. A command may ignore it entirely and call `inject()` at the
top of `run`; nothing else changes. "Once per invocation" means once across
`canExecute`, `run` and `postRun` together — whichever of them the CLI reaches
first triggers it, and the rest reuse the value.

`run`'s return value, and `postRun`
-----------------------------------

`run` may return a value. When the definition declares `postRun`, that value is
passed to it after `run` succeeds:

```ts
export default defineCommand({
	name: "create",
	arguments: [{ name: "appName", required: true }],
	async run(ctx) {
		const projectDir = await createProject(ctx.arguments.appName as string);
		return { projectDir };
	},
	postRun(ctx, { projectDir }) {
		printSuccessMessage(projectDir);
	},
});
```

`postRun` maps onto the legacy `postCommandAction`: the CLI runs it after the
command itself, outside the command's own error handling. The value travels
through `run`'s return rather than through a mutable field on the definition,
because a definition object is shared by every registration of it.

Other flags
-----------

- `disableAnalytics: true` — skips analytics tracking for this command.
- `enableHooks: false` — skips the before/after hooks that normally run around
  the command. Hooks are enabled by default.

Both are simply passed through to the command the CLI executes; omitting them
leaves the CLI's defaults in place.

Registering a definition
------------------------

Inside the CLI, a definition is registered with `registerCommand`:

```ts
import { registerCommand } from "../common/services/command-definition-adapter";

registerCommand({
	name: "widget|add",
	options: { force: booleanOption({ default: false }) },
	run: async (ctx) => { … },
});
```

It takes either a `DefinedCommand` — the result of `defineCommand`, marker and
all — or the definition itself, which it defines on your behalf, so registering
a command is one call. Either way the definition is validated before it reaches
the registry. It claims every name the definition declares, through the
`CommandRegistry` the target injector provides, and returns a
`DeferredCommandResult` — see *The owner is ambient* below. The command instance
is built by a factory on first resolution and cached.

Pass providers as the second argument to scope the command to a child injector
of the one it registers against — how a definition is parameterized per
registration:

```ts
for (const [name, platform] of buildCommandPlatforms) {
	registerCommand({ ...buildCommandDefinition, name }, [
		{ provide: BUILD_PLATFORM, useValue: platform },
	]);
}
```

That is how one definition serves several commands that differ only in data —
the platform each one targets — instead of one command subclassing another.

**Which injector it registers against is not a parameter.** It is the injector
of the current injection context — see *The owner is ambient* below — and the
CLI's own injector outside one. To register against some other injector, run
the call in its context:

```ts
runInInjectionContext(someInjector, () => registerCommand(definition));
```

A test registering into its own container does that too, which is the same
path the CLI itself takes.

`registerCommand` lives in
`lib/common/services/command-definition-adapter` rather than in
`nativescript/contracts`, because it reaches into the CLI runtime — the
side-effect-free contracts entry point deliberately does not pull it in.
`defineCommand`, the option helpers and all the types are exported from both
`nativescript/contracts` and `lib/common/define-command`.

Extensions do not need `registerCommand` at all: a
`nativescript.commands` manifest entry may point straight at a module that
exports a definition, and the CLI adapts and registers it lazily under the
manifest key (see [extensions.md](extensions.md)).

### Registering lazily

`registerCommand` needs the definition in hand, which means loading the module
that holds it. `registerLazyCommand` claims the name instead, and loads the
module the first time that one command is resolved:

```ts
import { registerLazyCommand } from "../common/services/command-definition-adapter";

registerLazyCommand<typeof import("./commands/run").iosRunCommand>(
	"run|ios",
	() => require("./commands/run").iosRunCommand,
);
```

The name routes immediately — including through the `run` dispatcher the CLI
synthesizes for it — so listing commands, resolving a sibling, or printing help
for the parent never loads `run.js`. The loader runs on the resolution of
`run|ios` alone, and what it returns is registered under the name that was
claimed.

**The type argument is mandatory.** `require()` is typed `any`, so nothing can
be inferred from the loader: without the type argument the name would be
checked against nothing at all. Leave it off and the `name` parameter says so:

```
error TS2345: Argument of type '"run|ios"' is not assignable to parameter of type
'"Pass the definition type: registerLazyCommand<typeof import('./commands/x').cmd>(...)"'
```

With the type argument, the name is checked against the one the definition
declares — every one of them, for a definition that declares aliases:

```
error TS2345: Argument of type '"run|iosss"' is not assignable to parameter of
type '"run|ios"'
```

and a type argument that is not a definition is rejected against the
constraint. The loader is re-checked at runtime as well, because the guarantee
is only as good as the type the call site passed.

**The loader must be synchronous.** `CommandsService` reads the resolved
command's `dashedOptions` before it validates the command line, so a command
that is still being imported has no options to validate against — a dynamic
`import()` here would report every flag as unknown. `require` is the tool for
this job.

**Providers are optional and cost nothing until the command runs.** The child
injector is built inside the loader, so a name that is never resolved never
creates one:

```ts
registerLazyCommand<typeof import("./commands/x").cmd>(
	"x",
	() => require("./commands/x").cmd,
	[{ provide: SOME_TOKEN, useValue: "value" }],
);
```

**The owner is ambient.** Every registration has an owner, which attributes
conflicts and load failures and makes re-registering the same name under the
same owner a no-op instead of a conflict. It is not a parameter: the helper
targets the injector of the current injection context when there is one, and
reads `COMMAND_OWNER` off it. Outside a context it targets the CLI's own
injector, and the CLI is the owner. An extension's module is loaded inside a
context whose injector provides `COMMAND_OWNER`, so a command the module
registers on its own is attributed to the extension without the module naming
itself — through `registerCommand` just as much as through this helper.

`registerCommand` therefore returns a `DeferredCommandResult` too: every
registration is arbitrated against the names already claimed, rather than
overwriting one.

**Conflicts are returned, not thrown.** The result is the same
`DeferredCommandResult` the extension manifest path gets — `{ registered:
true }`, or `registered: false` with a `rejection` to branch on. The CLI's own
bootstrap wraps the call and throws, because a name it cannot claim is a
mistake in `bootstrap.ts`; a host loading someone else's command usually wants
to warn and carry on. `describeRejection(rejection)` renders one for a human.

### One definition, several registrations

A family of commands that differ only in a value — `run|android` and `run|ios`,
say — is one definition registered several times, each with providers that
carry the value:

```ts
const PLATFORM = new InjectionToken<string>("commandPlatform");

for (const platform of ["android", "ios"]) {
	registerCommand({ ...definition, name: `run|${platform}` }, [
		{ provide: PLATFORM, useValue: platform },
	]);
}
```

The definition then reads `inject(PLATFORM)` — or `ctx.injector.get(PLATFORM)`
after the first `await` — and needs to know nothing else. The spread keeps the
`defineCommand` marker, so the copy is still a `DefinedCommand`.

This replaces the class-inheritance pattern the legacy commands use, where a
per-platform command subclasses a shared base to override one field.

Relationship to `ICommand`
--------------------------

A definition is compiled into an ordinary `ICommand`, so nothing downstream —
the registry, the router, hooks, help, analytics — knows the difference. The
mapping is:

| Definition                        | `ICommand`                                          |
| --------------------------------- | --------------------------------------------------- |
| `options`                         | `dashedOptions`                                     |
| `run`                             | `execute`, wrapped in an injection context          |
| `arguments`, `canExecute`         | `canExecute`: policy enforced, then the refinement  |
| `setup`                           | — run inside `canExecute`/`execute`, memoised       |
| `postRun`                         | `postCommandAction`, with `run`'s return value      |
| `allowUnknownOptions`             | `skipOptionsValidation`                             |
| —                                 | `allowedParameters`, always `[]`                    |
| `disableAnalytics`, `enableHooks` | passed through unchanged                            |

The compiled command always exposes `canExecute`, because `CommandsService`
stops consulting `allowedParameters` as soon as a command has one — the adapter
therefore enforces the `arguments` policy itself. `allowedParameters` stays
empty, which is why declared `arguments` are matched positionally rather than
by the `ICommandParameter` scan.

Existing command classes need no migration. Reach for a definition when a
command is mostly "parse these flags and do this"; a class still makes sense
when a command needs constructor-injected collaborators shared across several
methods, or `ICommandParameter` validators whose claim-any-argument matching it
actually depends on.
