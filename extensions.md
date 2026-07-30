Writing a CLI Extension
=======================

An extension adds new commands to the NativeScript CLI. Extensions are ordinary
npm packages: they are published to npm, installed per user rather than per
project, and are available from every project on the machine.

```bash
ns extension install <package-name>
ns extension uninstall <package-name>
```

Installed extensions live in the CLI profile directory, under
`extensions/node_modules/<package-name>`, and every CLI invocation consults each
of them. That makes the manifest below the most important file in an extension:
it is what the CLI reads on startup, and it decides whether your code is loaded
eagerly or only when one of your commands is actually executed.

## Making a package discoverable

Add the `nativescript:extension` keyword to `package.json`. The CLI searches npm
for that keyword when it needs to suggest an extension for an unknown command
(see [Suggesting an extension](#suggesting-an-extension-for-an-unknown-command)).

```json
{
	"name": "nativescript-hello",
	"version": "1.0.0",
	"keywords": ["nativescript:extension"]
}
```

## Declaring commands

Commands are declared in the `commands` key of the `nativescript` key of the
extension's `package.json`. Two shapes are accepted.

### A map of command name to module (recommended)

```json
{
	"nativescript": {
		"commands": {
			"hello|world": "./dist/commands/hello-world.js",
			"hello|*default": "./dist/commands/hello.js"
		}
	}
}
```

Each key is a command name; each value is a path to the module implementing it,
resolved relative to the extension's root directory.

Declaring commands this way is strongly preferred:

* **Per-command lazy loading.** Nothing in the extension is loaded when the CLI
  starts. A command's module is required the first time that command is
  resolved, so `ns build android` never pays the cost of loading an unrelated
  extension. With a large or dependency-heavy extension installed, that is the
  difference between a noticeable startup delay on every command and none.
* **Early, named conflict detection.** Two extensions claiming the same command
  name is reported as a warning that names both extensions and the contested
  command, and the extension that claimed it first keeps working. Under the
  legacy shape the same collision surfaces as an opaque
  `module '...' require'd twice.` failure from whichever extension happened to
  load second.
* **The CLI knows what you contribute without running you.** The declared
  command names are what the install suggestion for an unknown command matches
  against, and they are available to the CLI as metadata about the installed
  extension.

Malformed entries are skipped rather than fatal: an entry whose command name or
module path is not a non-empty string is reported as a warning naming the
extension and the offending entry, and the extension's remaining commands are
still registered.

### An array of command names (legacy)

```json
{
	"nativescript": {
		"commands": ["hello|world", "hello|*default"]
	}
}
```

The array is a discovery aid only — it lists the names the CLI may suggest your
extension for, but it says nothing about where the implementations live. An
extension declaring commands this way (or declaring no commands at all) is
loaded the old way: the CLI `require()`s the package's main entry on **every**
invocation and expects the module's top-level code to register everything.

```js
// index.js of a legacy extension
const path = require("path");

global.$injector.requireCommand(
	"hello|world",
	path.join(__dirname, "commands", "hello-world"),
);
```

This path remains supported, but it is tracked for eventual deprecation. Run any
command with `--log trace` to see which installed extensions still rely on it,
or set `NS_DEPRECATIONS=warn` to have those reports printed as warnings.

## Writing a command module

The recommended shape is a module exporting a `defineCommand` definition (see
[defining-commands.md](defining-commands.md)) — the CLI adapts and registers it
under the manifest key when the command is first executed, and the module needs
no registration side effects at all:

```js
// dist/commands/hello-world.js
const { defineCommand, inject } = require("nativescript/contracts");

module.exports = defineCommand({
	name: "hello|world",
	arguments: "any",
	async run(ctx) {
		inject("logger").info(`Hello, ${ctx.args[0] || "world"}!`);
	},
});
```

Alternatively, a module may register itself when it is loaded, by calling
`$injector.registerCommand` at the top level with the same name it is declared
under in the manifest. The CLI resolves the command through the injector right
after loading the module, so registration has to happen as a side effect of the
`require`.

```js
// dist/commands/hello-world.js
class HelloWorldCommand {
	constructor($logger) {
		this.$logger = $logger;
		this.allowedParameters = [];
	}

	async execute(args) {
		this.$logger.info(`Hello, ${args[0] || "world"}!`);
	}
}

global.$injector.registerCommand("hello|world", HelloWorldCommand);
```

Constructor parameters are injected by name: a parameter called `$logger`
receives the CLI's logger, `$fs` its file system service, and so on. A command
class must expose `allowedParameters` and an `execute(args)` method.

## Command names

Command names use `|` to express hierarchy, so `"hello|world"` is invoked as
`ns hello world`. Prefixing the last segment with `*` marks a default
subcommand: `"hello|*default"` runs both for `ns hello default` and for a bare
`ns hello`.

When an extension contributes several commands under the same parent, declare
the default command before its siblings — the CLI creates the parent dispatcher
from the first entry it sees, and a default command registered after that parent
already exists is rejected.

## Suggesting an extension for an unknown command

When a user types a command the CLI does not know, it searches npm for packages
carrying the `nativescript:extension` keyword, reads the `nativescript.commands`
key of each candidate's published `package.json`, and matches it against the
words the user typed — longest match first, so `ns valid command with args`
matches a declared `valid|command|with` before `valid|command`. A declared
default command also matches its short form: an extension declaring
`hello|*default` is suggested for a bare `ns hello`.

Both manifest shapes participate in this matching. If a match is found, the CLI
tells the user which extension provides the command and how to install it:

```
The command hello world is registered in extension nativescript-hello.
You can install it by executing 'ns extension install nativescript-hello'
```

## Documentation

Point the `docs` key of the `nativescript` key at a directory of `.md` files to
have the CLI's help system pick up the help for your commands.

```json
{
	"nativescript": {
		"docs": "./docs",
		"commands": {
			"hello|world": "./dist/commands/hello-world.js"
		}
	}
}
```
