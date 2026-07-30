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
		verbose: booleanOption({ default: false }),
		output: stringOption({ alias: "o" }),
	},
	arguments: "any",
	async run(ctx) {
		// ctx.args    -> string[] of positional arguments
		// ctx.options -> { verbose: boolean; output: string }
		if (ctx.options.verbose) {
			console.log(`adding ${ctx.args.join(", ")} to ${ctx.options.output}`);
		}
	},
});
```

`defineCommand` returns the definition, tagged with a marker symbol so that any
copy of the CLI can recognise it (`isCommandDefinition(value)` is the exported
predicate). It does not register anything by itself — see
[Registering a definition](#registering-a-definition).

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

Options
-------

`options` is a schema keyed by the long option name — `verbose` is passed as
`--verbose`. Declare each entry with one of the four helpers, which fix the
value type:

| Helper          | Value type on `ctx.options` |
| --------------- | --------------------------- |
| `booleanOption` | `boolean`                   |
| `stringOption`  | `string`                    |
| `numberOption`  | `number`                    |
| `arrayOption`   | `string[]`                  |

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
- `alias` — single-dash shorthand, or an array of them.
- `hasSensitiveValue` — defaults to `false`; set it for anything that must not
  be recorded. There is no reason not to be explicit about credentials, paths
  containing user directories, and tokens.
- `description` — shown in generated help.

The schema types `ctx.options` and nothing else: `ctx.options` carries exactly
the declared keys, with the types the helpers imply. Values that the CLI parses
globally (`--path`, `--log`, …) are not exposed there; resolve the `options`
service if you need them.

### How validation behaves

Option validation is the CLI's existing behaviour, not something the definition
opts into. Before a command runs, the parser is re-primed with that command's
declared options and the command line is re-parsed:

- Declared options are accepted and appear on `ctx.options`.
- An option the CLI does not know — neither global nor declared by this command
  — is a **hard error**: the command does not run, and the CLI prints
  `The option '<name>' is not supported.` followed by a help suggestion.

So adding an option is exactly a matter of adding a schema entry; forgetting to
declare one that users pass is a failure, not a silent `undefined`.

Positional arguments
--------------------

`arguments` declares whether the command takes positional arguments at all:

- `"none"` (the default) — the command accepts no positional arguments. Passing
  any is rejected with `This command doesn't accept parameters.`
- `"any"` — positional arguments are accepted and handed to `run` as
  `ctx.args`.

Anything finer than that belongs in `canExecute`.

### `canExecute` owns validation

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

`canExecute` receives the same context as `run` and returns a boolean (or a
promise of one). Returning `false` aborts the command and prints a help
suggestion; throwing surfaces your own error message, which is usually the
friendlier choice.

There is one rule to internalise: **the moment a command supplies
`canExecute`, it owns argument validation completely.** The framework returns
that verdict and skips every built-in parameter check, including the
"no parameters" rule implied by `arguments: "none"`. A definition with a
`canExecute` that only inspects options will therefore accept stray positional
arguments unless it checks `ctx.args` itself. If you do not need custom
validation, omit `canExecute` and let `arguments` do the work.

The run context
---------------

`run(ctx)` receives:

- `ctx.args` — `string[]`, the positional arguments left after the command name
  (including any subcommand segments) has been consumed.
- `ctx.options` — the current value of each declared option, read at the moment
  the command executes.

`run` may be synchronous or `async`; the CLI awaits the result and treats a
rejection as a command failure.

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

It registers the definition under every name it declares, on the CLI's injector
by default; pass a second argument to target a different injector (tests do
this). The command instance is created on first resolution and cached.

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

| Definition                        | `ICommand`                                 |
| --------------------------------- | ------------------------------------------ |
| `options`                         | `dashedOptions`                            |
| `run`                             | `execute`, wrapped in an injection context |
| `arguments`, `canExecute`         | `canExecute` (see the rule above)          |
| —                                 | `allowedParameters`, always `[]`           |
| `disableAnalytics`, `enableHooks` | passed through unchanged                   |

Existing command classes need no migration. Reach for a definition when a
command is mostly "parse these flags and do this"; a class still makes sense
when a command needs constructor-injected collaborators shared across several
methods, custom `ICommandParameter` validators, or a `postCommandAction`.
