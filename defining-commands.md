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

A command may also be written as a class, with the handlers as methods — see
[Class form](#class-form). It is sugar over `defineCommand`: everything below
describes both.

Validation happens where you can see it
---------------------------------------

A definition is checked at the moment `defineCommand` is called, not when the
command eventually runs. A misspelled field, a missing `run`, an option
declared with something other than the five helpers, an `arguments` value
outside `"none" | "any"` — each throws immediately, naming the command and the
accepted form. The class form's meta is checked the same way at the
`Command({ ... })` call, which also rejects handlers passed there; only a
missing `run` method waits until the definition is first read:

```
Invalid command definition for 'widget|add': unknown field(s) 'handler'; a
definition accepts name, description, options, arguments, allowUnknownOptions,
canExecute, disableAnalytics, enableHooks, providers, setup, run, shortcuts,
postRun. Accepted form: defineCommand({ name: "widget|add", run(ctx) { ... } })
— with the optional fields description, options, arguments,
allowUnknownOptions, providers, setup, canExecute, shortcuts, postRun,
disableAnalytics and enableHooks. Or the class form, class WidgetAdd extends
Command({ name: "widget|add" }) { run() { ... } }, which declares the same
fields except the handlers and implements run, and optionally canExecute,
postRun and shortcuts, as methods.
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
`--output`. Declare each entry with one of the five helpers, which fix the
value type:

| Helper          | Declared with `default` | Declared without        |
| --------------- | ----------------------- | ----------------------- |
| `booleanOption` | `boolean`               | `boolean \| undefined`  |
| `stringOption`  | `string`                | `string \| undefined`   |
| `numberOption`  | `number`                | `number \| undefined`   |
| `arrayOption`   | `string[]`              | `string[] \| undefined` |
| `objectOption`  | `any`                   | `any`                   |

`objectOption` is for flags the parser nests, such as `--env.production`, and
its value is untyped.

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
spelling _means_:

- a declared option whose name matches a CLI-wide one but whose type differs —
  `verbose: stringOption()` against the CLI's boolean `--verbose`;
- an alias that belongs to a _different_ CLI-wide option — `output:
stringOption({ alias: "p" })` steals `--path`'s shorthand. Restating an
  option's own shorthand (`path: stringOption({ alias: "p" })`) is fine.

A redeclaration that leaves `alias`, `default` or `hasSensitiveValue` unset
keeps what the CLI-wide declaration carries for them, so `path: stringOption()`
still answers to `-p` and stays out of the logs; set one only to change it.

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
CLI's own options. `allowUnknownOptions: true` lets unknown flags through for
that command:

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

An unknown flag is neither warned about nor rejected. Everything else about
validation still applies: the parser is re-primed with the command's declared
options, so `ctx.options.disableNpmInstall` above carries its value, and a
known option passed with the wrong shape is still reported. Reach for it only
when forwarding.

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
		ctx.params.platform; // "android"
		ctx.params.template; // "blank", or absent
		ctx.params.files; // string[], possibly empty
	},
});
```

A spec accepts:

- `name` — the key the value appears under on `ctx.params`, and the name
  messages use.
- `required` — defaults to false. A required argument may not follow an
  optional one; positional matching would never be able to satisfy it.
- `variadic` — collects every remaining argument as a `string[]`. Must be the
  last spec. A required variadic wants at least one value.
- `description` — reserved for generated help, like an option's.
- `errorMessage` — replaces `Missing required argument '<name>'.` when the
  argument is required and absent.
- `validate(value, ctx)` — run per value, `ctx` being the same context `run`
  receives, inside the invocation's injection context. Return `true` to
  accept; return `false` for a default message, or return the message itself
  as a string. It may be `async`.

Enforcement happens after `setup` and before `canExecute`, in this order:
missing required arguments (every missing one is named at once), then too many
arguments, then each `validate`.

### Matching is strictly positional

The first spec takes the first argument, the second spec the second, and so on.
This is a deliberate divergence from the `ICommandParameter` machinery a
hand-written command class uses, where `CommandsService` scans the validators
and lets a mandatory parameter claim whichever argument happens to satisfy it —
so `ns command b a` could satisfy `[a, b]`. Nothing in the CLI depends on that
behaviour, and positional is what the declaration reads like.

The practical consequence: `ctx.params.template` is `args[1]` whether or not
`args[1]` looks like a template. An argument that could be several things is a
job for `validate` or for `canExecute`, not for the matcher.

`ctx.params` is always present, even with `arguments: "none"` or `"any"` —
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

`canExecute` receives the same context object `run` does: one context is built
when the invocation opens and every stage of it shares that object. It
returns a boolean (or a promise of one). Returning `false` aborts the
command and prints a bare help suggestion; `ctx.fail(message)` aborts it with
your own message, which is usually the friendlier choice.

`canExecute` runs inside a dependency-injection context, on the same terms as
`run`: `inject()` is valid up to the first `await`.

The run context
---------------

`run(ctx)` receives:

- `ctx.args` — `string[]`, the positional arguments left after the command name
  (including any subcommand segments) has been consumed.
- `ctx.params` — the same arguments keyed by the names the `arguments` specs
  declare, `{}` when there are none. It is spelled `params` because
  `arguments` is a reserved binding name in strict mode, so a destructuring
  `const { args, arguments } = ctx` would not even parse.
- `ctx.options` — the current value of each declared option, read at the moment
  the command executes.
- `ctx.injector` — this invocation's injector, a child of the one the command
  was registered against; see
  [Injection, and the first `await`](#injection-and-the-first-await).
- `ctx.fail(message, options?)` — fails the command with `message`, followed
  by a usage help suggestion unless `options.help` is `false`.

`run` may be synchronous or `async`; the CLI awaits the result and treats a
rejection as a command failure.

### Failing a command

`ctx.fail(message)` is the idiomatic way to stop a command. By default it
follows the message with the usage help suggestion — the "Run `ns widget add
--help`" line — which is what the user needs when they got the command line
wrong: a missing argument, an unknown value, an invalid combination of options.

When the command line was fine and something else is not — the environment,
the project, a file on disk — the help suggestion only gets in the way. Pass
`{ help: false }` to print the message alone:

```ts
defineCommand({
	name: "widget|add",
	arguments: "any",
	options: { output: stringOption() },
	async run(ctx) {
		if (!ctx.options.output) {
			ctx.fail("--output is required.");
		}

		if (fs.existsSync(ctx.options.output)) {
			ctx.fail(`${ctx.options.output} already exists.`, { help: false });
		}

		/* ... */
	},
});
```

It is available on the `setup` and `canExecute` contexts as well, and it
returns `never`, so it can end a branch without a `return`. The message must be
a non-empty string, and `options`, when given, a plain object. The two forms
map onto the `errors` service's `failWithHelp` and `fail`.

Throwing keeps working too: an error thrown from a handler propagates
unchanged. Throw when you already have an `Error` to propagate; call
`ctx.fail` when you are writing the message.

Injection, and the first `await`
--------------------------------

`setup`, `canExecute`, `run`, `postRun` and `shortcuts`, an argument's
`validate` and each precondition start inside a dependency-injection context,
so `inject()` works directly:

```ts
import { defineCommand, inject, DoctorService } from "nativescript/contracts";

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
prevents. It is the **invocation's own injector**: a child of the one the
command was registered against, holding the context under `COMMAND_CONTEXT`
and any per-command providers — see
[Registering a definition](#registering-a-definition). `inject()` before the
first `await` and `ctx.injector.get()` after it are therefore the same lookup
against the same injector. The same guidance, and the reasoning behind it, is
in `dependency-injection.md`.

Where a handler gets its services
---------------------------------

A handler resolves what it needs itself, at the top of its own body:

```ts
export default defineCommand({
	name: "widget|add",
	arguments: "any",
	providers: [provideProject()],
	async run(ctx) {
		const widgets = inject(WidgetService);
		const projectData = inject(ProjectData);

		await widgets.add(ctx.args, projectData);
	},
});
```

### Declaring what the command needs: `providers` and preconditions

A definition may carry `providers`, added to each invocation's own injector
next to the context, so a factory or class among them can inject the
invocation and is built once per invocation. An entry is an object with a
`provide` token or a bare class, which stands for
`{ provide: Cls, useClass: Cls }` as in Angular; anything else is rejected
when the definition is defined. One token in that list is
special: `COMMAND_PRECONDITIONS` is a multi token, and every
`{ provide: COMMAND_PRECONDITIONS, multi: true, useValue: check }` contributes
a **precondition** — a check on the environment the command runs in, as
opposed to `canExecute`, which judges the arguments. Preconditions run when
the invocation opens, in declaration order, before `setup` and before the
arguments policy, inside the injection context, and a throw fails the
invocation. That fixed order is the point: being outside a project is what a
bad invocation reports first.

Each entry is a function, or a list of functions. Anything else fails the
first invocation with `Command '<name>': COMMAND_PRECONDITIONS entry #n is not
a function or a list of functions.`

Multi providers are per injector level, as in Angular. A command that declares
any precondition of its own, `provideProject()` included, replaces the
preconditions provided by the scope it was registered in; the two lists do not
merge. To keep the scope's preconditions, contribute the parent's list as one
more entry:

```ts
import { COMMAND_PRECONDITIONS, inject } from "nativescript/contracts";

providers: [
	{
		provide: COMMAND_PRECONDITIONS,
		multi: true,
		useFactory: () =>
			inject(COMMAND_PRECONDITIONS, { skipSelf: true, optional: true }) || [],
	},
	provideProject(),
],
```

A built-in imports `inject` from `"../common/di"` instead.

The precondition every project command declares comes from a helper. The
built-in sample below imports it relatively; a plugin imports `provideProject`
from `"nativescript/contracts"`.

```ts
import { provideProject } from "../command-base";

export default defineCommand({
	name: "platform|clean",
	providers: [provideProject()],
	run(ctx) {
		const projectData = inject(ProjectData); // the project the command line names
	},
});
```

`provideProject()` resolves the project from `--path` or the working
directory and fails the invocation with the usual "no project found" error
when there is none. A command that does not declare it — `doctor`, `create`,
the `device` family — pays nothing. In such a command `inject(ProjectData)`
returns the process-wide object uninitialised, without any error. A command
that wants the project only when there is one, like `clean` or
`device put-file`, resolves `ProjectData` behind its own check and calls
`initializeProjectData()` there. A command that always needs the project
declares the provider. A plugin adds its own preconditions the same way, with
its own helper returning a multi provider for the token.

The injection context is synchronous, so the `inject()` calls belong **above
the first `await`** — see [Injection, and the first
`await`](#injection-and-the-first-await). Resolve everything the handler needs
there and the rule never bites; for anything that genuinely has to wait —
resolved after an `await`, or inside a helper called later — use
`ctx.injector.get(token)`, which works at any point.

**Services are never bundled.** There is no `setupXCommand()` returning an
object of injected services for another command to spread, and no
`IXCommandServices` type travelling between commands. A dependency is named
where it is used, so reading a handler tells you exactly what it touches.
Sharing is either of two things, and neither of them is a bag:

- **Shared logic** — a plain function taking the typed `ctx` and plain values,
  resolving its own services through `ctx.injector.get(...)`:

  ```ts
  export async function canBuildFor(
  	ctx: CommandContext<any>,
  	platform: string,
  ): Promise<boolean> {
  	const validation = ctx.injector.get(PlatformValidationService);
  	return validation.canBuild(platform);
  }
  ```

- **A whole command's precondition** — `CommandsService.canExecuteCommand`,
  which asks that command itself; see [Asking another
  command](#asking-another-command).

### `setup`, when a command has one

`setup(ctx)` runs once per invocation, after the preconditions and before the
arguments policy and `canExecute`, and its return value is handed to `canExecute`, `run` and `postRun` as their second argument.
"Once per invocation" means once across the three together — whichever the CLI
reaches first triggers it, and the rest reuse the value.

It is optional sugar for **one** command's own handlers, for the case where
`canExecute` and `run` would otherwise repeat the same per-invocation
derivation. It is never a place to assemble services for anything but the
command it belongs to, and a command with a single handler does not need it at
all. When a command has enough structure to want one, the
[class form](#class-form) usually says the same thing better: the instance *is*
the setup, and each dependency is a field.

`run`'s return value, and `postRun`
-----------------------------------

`run` may return a value. When the definition declares `postRun`, that value is
passed to it after `run` succeeds:

```ts
export default defineCommand({
	name: "create",
	arguments: [{ name: "appName", required: true }],
	async run(ctx) {
		const projectDir = await createProject(ctx.params.appName as string);
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

Class form
----------

`Command(meta)` returns a base class to extend. It is sugar over
`defineCommand` and nothing more: the class carries a `static definition` built
by `defineCommand`, and that definition is the only thing the CLI ever
executes.

```ts
import {
	Command,
	inject,
	ProjectData,
	provideProject,
	stringOption,
} from "nativescript/contracts";

export class PlatformCleanCommand extends Command({
	name: "platform|clean",
	description: "Removes and adds again the selected platform.",
	options: { frameworkPath: stringOption() },
	arguments: "any",
	providers: [provideProject()],
}) {
	private $platformCommandHelper = inject<IPlatformCommandHelper>(
		"platformCommandHelper",
	);
	private $projectData = inject(ProjectData);

	public async run(): Promise<void> {
		await this.$platformCommandHelper.cleanPlatforms(
			this.args,
			this.$projectData,
			this.options.frameworkPath,
		);
	}
}
```

`meta` is the definition minus its handlers: `name`, `description`, `options`,
`arguments`, `allowUnknownOptions`, `disableAnalytics`, `enableHooks` and
`providers`. The
handlers are methods instead — `run` is required, and `canExecute`, `postRun`
and `shortcuts` are optional, each with the same meaning and the same ordering
as the fields of the same name. The result type is inferred from `run`, and
`postRun(result)` receives it, awaited, with no type argument to restate;
`shortcuts()` returns the same table `shortcuts(ctx, setup)` does. A method the
class does not declare is left out of the definition entirely, so a class
without `postRun` gets no `postCommandAction`, exactly as an object without one
does.

**Which form to use.** The class form is for a single named command with
internal structure: state shared between `canExecute` and `run`, values derived
once per invocation, several private steps, or enough collaborators that
`this.$service` reads better than a local in every handler. Everything simpler
— a handful of services and a short handler — is an object definition with its
handlers written inline, where `ctx` is typed by inference and there is nothing
to name.

When a function generates variants of one command — the `run|ios` /
`run|vision` family, one definition per platform — the object form is what
fits, because the thing being parameterized is a value and definitions are
values. Registering the same class twice under two names is not the
equivalent: the class is one definition.

**The class is the setup.** One instance is constructed per invocation, as that
invocation's `setup`, before `canExecute` runs. So field initializers and the
constructor run inside the injection context: `inject()` in a field initializer
resolves, and a constructor — optional, and if written it must call a bare
`super()` — is where the work a legacy command did in its own constructor goes.
Because construction is the setup, `inject()` is valid throughout it; after the
first `await` inside a method, use `this.context.injector.get(token)` as
[Injection, and the first `await`](#injection-and-the-first-await) describes.

**`this.context`, `this.options` and `this.args`** are the same context the
object form's handlers receive, typed from the `options` the meta declares:
`this.options.frameworkPath` is `string | undefined` above, and a name the
schema does not declare is a compile error. `this.context` also carries
`params`, `injector` and `fail`.

**Per-command providers see the invocation.** The context is provided to the
invocation's own child injector under the `COMMAND_CONTEXT` token, which is how
the base class reads it. A provider registered for one command — through the
`providers` argument of `registerCommand` or `registerLazyCommand` — lives in
that same child, so a factory or class among them can inject the context too.
The cost is that such a provider is built once per invocation, never shared
across invocations, and resolves nothing outside a running one.

**One field per dependency.** Each service the class uses is its own field,
read as `this.$x`:

```ts
export class PlatformAddCommand extends Command({
	name: "platform|add",
	providers: [provideProject()],
}) {
	private $projectData = inject(ProjectData);
	private $platformHelper = inject<IPlatformCommandHelper>(
		"platformCommandHelper",
	);
	// ...
}
```

Never a `private services = injectSomething()` holding a bag — the fields are
the point, and a bag puts the dependency list back behind one more hop. Two
commands needing the same four services restate those four lines; that
duplication is cheaper than a shared shape neither of them owns.

**Share logic, not base classes and not services.** What two commands genuinely
have in common is a check or a step, so share a function that takes
`this.context` and plain values and resolves its own services — see [Where a
handler gets its services](#where-a-handler-gets-its-services). To reuse
another command's precondition whole, ask that command: [Asking another
command](#asking-another-command). A base class between `Command()` and the
command is the pattern the legacy `ICommand` hierarchy used, and untangling it
is most of why this API exists.

Registration takes the class itself; see
[Registering a definition](#registering-a-definition):

```ts
registerBuiltInCommand<
	typeof import("./commands/platform-clean").PlatformCleanCommand
>(
	"platform|clean",
	() => require("./commands/platform-clean").PlatformCleanCommand,
);
```

`isCommandClass(value)` is the exported check, and `Ctor.definition` is the
definition the class stands for — derived once per class, and derived for the
subclass rather than for the base `Command()` returned. A class that implements
no `run`, or a class that did not come from `Command()`, is refused with the
same message shape a bad object gets.

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

Every registration helper — `registerCommand`, `registerLazyCommand` and
`registerBuiltInCommand` — takes a [class form](#class-form) command wherever
it takes a definition, and reads the name it declares through its
`static definition`.

It takes either a `DefinedCommand` — the result of `defineCommand`, marker and
all — or the definition itself, which it defines on your behalf, so registering
a command is one call. Either way the definition is validated before it reaches
the registry. It claims every name the definition declares, through the
`CommandRegistry` the target injector provides, and returns a
`DeferredCommandResult` — see _The owner is ambient_ below. The command instance
is built by a factory on first resolution and cached.

Pass providers as the second argument to add them to each invocation's child
injector, the one `ctx.injector` names, next to the definition's own
`providers` — how a definition is parameterized per registration:

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
of the current injection context — see _The owner is ambient_ below — and the
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

Running a command in process
----------------------------

The `CommandsService` contract dispatches a registered command from inside the
process that is already running. It is a service like any other, so it follows
the rule every service does: `inject()` before the first `await`, the
injector after it, and a key shortcut's action reaches it through the
injector its context carries:

```ts
import { CommandsService } from "nativescript/contracts";

// in a class command
private $commandsService = inject(CommandsService);
await this.$commandsService.runCommand("autocomplete");

// in an inline handler, after the first await
await ctx.injector.get(CommandsService).runCommand("install", ["lodash"]);

// in a shortcut action
action: (ctx) => ctx.injector.get(CommandsService).runCommand("open|ios"),
```

The command gets what a typed command line gives it, in the same order: its
declared options are primed into the parser — so `ctx.options` holds this
command's values and its declared defaults rather than the outer command
line's — then its preconditions, as the invocation opens, then `setup`, then
the `arguments` policy, then `canExecute`, then `run`, `postRun`, and the
command's hooks.

Two things differ, both because the caller is a process that has to keep
running afterwards:

- **A failure throws instead of exiting.** A failed command line ends in
  `process.exit`. `runCommand` reports the failure the same way — the same
  message formatting, the same `ns … --help` suggestion — and then throws, so
  the caller decides what happens next.
- **Analytics do not fire.** An in-process dispatch is not a new invocation of
  the CLI, and the consent check can prompt on a terminal the caller has put
  into raw mode. Hooks do fire, under the same names the command line fires:
  `open|ios` fires `before-open-ios` and then `before-open` (and `after-open`,
  `after-open-ios` on the way out), however the command was reached.

The options service is put back the way it was found. Merging a command's
declarations into it rewrites the values the host process is still running on
— `open|ios` declares `watch: false`, which would otherwise leave an `ns start`
out of watch mode for the rest of its life.

In-process dispatches nest; they never overlap. The options are put back in
the order the dispatches were entered, which only restores the right values
when each one finishes before the dispatch it was started from. A dispatch
started while another is in flight, and not from inside it — two
`runCommand` calls under one `Promise.all`, say — is rejected with
`Cannot dispatch '…' in process while '…' is still running: in-process
dispatches must nest, not overlap; await the running one first.` Await one
before starting the next.

There is deliberately no free `runCommand()` function: one that silently fell
back to the CLI's root injector outside an injection context would dispatch
through the wrong scope from exactly the places — after an `await`, inside a
stdin handler — where the mistake is hardest to notice. The injector you hold
is the one to dispatch through.

### Asking another command

Both methods take a registered name, or — the typed way — a definition or
`Command()` class. A name is looked up in the registry, and a parent name is
routed to its subcommand the way the command line routes it —
`runCommand("device")` runs `device|*list`, `runCommand("device", ["log"])`
runs `device|log`; a definition runs as
given, whether or not it is registered, so `runCommand(prepareCommandDefinition)`
runs exactly what you hold and cannot go stale the way a string can. Its first
name still identifies it for hooks and reporting.

A definition run as given is compiled against an injector chosen at the call,
the way Angular's `createComponent` takes one: the `injector` in the options
bag when one is passed, otherwise the injection context the call is made from,
otherwise the CLI's root. So a definition dispatched from inside an
extension's command lands under the extension's scope, where `registerCommand`
would have placed it, and a caller holding a scope of its own names it:

```ts
await commandsService.runCommand(definition, args, { injector });
```

A registered command keeps the scope it was registered under, and passing
`injector` together with a name throws.

`CommandsService.canExecuteCommand(command, args)` asks a registered command
whether it *could* run, without running it:

```ts
import { CommandsService } from "nativescript/contracts";

private $commandsService = inject(CommandsService);

async canExecute(): Promise<boolean> {
	if (
		!(await this.$commandsService.canExecuteCommand(
			prepareCommandDefinition,
			[this.args[0]],
		))
	) {
		return false;
	}

	return !!this.hostProjectPath;
}
```

This is how one command builds on another's precondition. `embed` prepares the
project, so "could `embed` run" starts with "could `prepare` run" — and the way
to ask that is to ask `prepare`, not to import its `canExecute` and hand it
services. The named command is resolved and its options primed exactly as
`runCommand` does, then its own `canExecute` returns its verdict or throws. It
builds its own setup from its own services; nothing crosses between the two
commands but the name and the arguments.

Pass only the arguments the child's own `arguments` policy accepts. The child
enforces that policy before its `canExecute`, so forwarding a caller's whole
argument list to a child that declares fewer is a rejection, not a wider check.

`canExecuteCommand` follows `runCommand` in everything else: the same option
priming and restoration, the same routing of a parent name to its subcommand.
The deprecated `canExecuteCommandInProcess` and `executeCommandInProcess`
call the two methods with a name.

### Key shortcuts

The interactive keys `ns start` and `ns run` offer are the CLI's own caller. A
shortcut is a table entry with a `when` deciding whether the key is live, and
an `action` that runs it:

```ts
{
	key: "I",
	description: "Open project in Xcode",
	when: onPlatform("iOS"),
	action: (ctx) => ctx.injector.get(CommandsService).runCommand("open|ios"),
}
```

The context an action receives carries state and nothing else — the platform
being watched, whether this is `ns start` or an `ns run` child it spawned, and
the injector. Capabilities are resolved from that injector rather than handed
over as context methods:

```ts
action: (ctx) => ctx.injector.get<IStartService>("startService").runIOS(),
```

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
| `setup`                           | — run inside `canExecute`/`execute`, memoised      |
| `postRun`                         | `postCommandAction`, with `run`'s return value     |
| `allowUnknownOptions`             | `allowUnknownOptions`                              |
| —                                 | `allowedParameters`, always `[]`                   |
| `disableAnalytics`, `enableHooks` | passed through unchanged                           |

The compiled command always exposes `canExecute`, because `CommandsService`
stops consulting `allowedParameters` as soon as a command has one — the adapter
therefore enforces the `arguments` policy itself. `allowedParameters` stays
empty, which is why declared `arguments` are matched positionally rather than
by the `ICommandParameter` scan.

Existing command classes need no migration. Reach for a definition when a
command is mostly "parse these flags and do this"; a legacy `ICommand` class
still makes sense when a command needs constructor-injected collaborators shared across several
methods, or `ICommandParameter` validators whose claim-any-argument matching it
actually depends on.
