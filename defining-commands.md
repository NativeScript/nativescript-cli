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
definition accepts name, description, options, arguments, canExecute,
disableAnalytics, enableHooks, run. Accepted form: defineCommand({ name:
"widget|add", run(ctx) { ... } }) — with the optional fields description,
options, arguments, canExecute, disableAnalytics and enableHooks.
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
the declared keys, and a typo is a compile error. Values that the CLI parses
globally (`--path`, `--log`, …) are not exposed there; resolve the `options`
service if you need them.

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

### Do not shadow a CLI-wide option

`--verbose`, `--path`, `--log`, `--release`, `--env` and friends are declared by
the CLI itself. Declaring one of those names in a command's schema makes the
command's declaration win for the duration of that command, which means the
same flag means different things depending on which command is running. The CLI
warns at registration naming both sides of the collision; pick another name.

Aliases count too, in both directions: an `alias: "p"` collides with `--path`'s
shorthand just as `output: stringOption()` would collide with a CLI-wide
`--output`.

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

Positional arguments
--------------------

`arguments` declares whether the command takes positional arguments at all:

- `"none"` (the default) — the command accepts no positional arguments. Passing
  any is rejected with `This command doesn't accept parameters.`
- `"any"` — positional arguments are accepted and handed to `run` as
  `ctx.args`.

Anything finer than that belongs in `canExecute`.

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
- `ctx.options` — the current value of each declared option, read at the moment
  the command executes.
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

`run` starts inside a dependency-injection context, so `inject()` works
directly:

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

The injection context is synchronous: `inject()` is valid up to the first
`await` in `run`, and not after it. Capture what you need at the top of `run`,
or inject the `Injector` itself and use `injector.get()` for late lookups. See
`dependency-injection.md`.

Other flags
-----------

- `disableAnalytics: true` — skips analytics tracking for this command.
- `enableHooks: false` — skips the before/after hooks that normally run around
  the command. Hooks are enabled by default.

Both are simply passed through to the command the CLI executes; omitting them
leaves the CLI's defaults in place.

Registering a definition
------------------------

Inside the CLI, a definition is registered with `registerCommandDefinition`:

```ts
import { registerCommandDefinition } from "../common/services/command-definition-adapter";
import addWidgetCommand from "./add-widget";

registerCommandDefinition(addWidgetCommand);
```

It takes a `DefinedCommand` — the result of `defineCommand`, marker and all —
and rejects a bare object of the right shape, so a definition can never reach
the registry without having been validated. It registers under every name the
definition declares, through the `CommandRegistry` the target injector provides;
pass a second argument to target a different injector (tests do this). The
command instance is built by a factory on first resolution and cached.

`registerCommandDefinition` lives in
`lib/common/services/command-definition-adapter` rather than in
`nativescript/contracts`, because it reaches into the CLI runtime — the
side-effect-free contracts entry point deliberately does not pull it in.
`defineCommand`, the option helpers and all the types are exported from both
`nativescript/contracts` and `lib/common/define-command`.

Declaring commands from an extension manifest, so that an extension does not
have to call a registration function at load time, is being added separately.
Until then, extensions register definitions the same way the CLI does.

Relationship to `ICommand`
--------------------------

A definition is compiled into an ordinary `ICommand`, so nothing downstream —
the registry, the router, hooks, help, analytics — knows the difference. The
mapping is:

| Definition                        | `ICommand`                                         |
| --------------------------------- | -------------------------------------------------- |
| `options`                         | `dashedOptions`                                    |
| `run`                             | `execute`, wrapped in an injection context         |
| `arguments`, `canExecute`         | `canExecute`: policy enforced, then the refinement |
| —                                 | `allowedParameters`, always `[]`                   |
| `disableAnalytics`, `enableHooks` | passed through unchanged                           |

The compiled command always exposes `canExecute`, because `CommandsService`
stops consulting `allowedParameters` as soon as a command has one — the adapter
therefore enforces the `arguments` policy itself.

Existing command classes need no migration. Reach for a definition when a
command is mostly "parse these flags and do this"; a class still makes sense
when a command needs constructor-injected collaborators shared across several
methods, custom `ICommandParameter` validators, or a `postCommandAction`.
