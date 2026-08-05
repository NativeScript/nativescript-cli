Writing a CLI Extension
=======================

An extension adds new commands to the NativeScript CLI. Extensions are ordinary
npm packages.

```bash
ns extension install <package-name>
ns extension uninstall <package-name>
```

Installed extensions live in the CLI profile directory, under
`extensions/node_modules/<package-name>`, and every CLI invocation consults each
of them. That makes the manifest below the most important file in an extension:
it is what the CLI reads on startup, and it decides whether your code is loaded
eagerly or only when one of your commands is actually executed.

## Depending on the CLI

An extension that imports anything from the CLI — `defineCommand`, `inject`, the
types — needs `nativescript` declared twice:

```json
{
	"name": "nativescript-hello",
	"version": "1.0.0",
	"keywords": ["nativescript:extension"],
	"peerDependencies": {
		"nativescript": ">=9.1.0"
	},
	"devDependencies": {
		"nativescript": "^9.1.0"
	}
}
```

- The **peer dependency** declares which CLI versions the extension works with,
  and keeps package managers from installing a second copy of the CLI next to
  your extension. Your code must run against the _running_ CLI: a second copy
  brings its own injector, and services resolved from it are not the ones
  executing the command.
- The **dev dependency** is what makes `require("nativescript/contracts")`
  resolve while you build and test the extension. It is not installed for your
  users.
- Developing against a **prerelease** CLI? Semver ranges without a prerelease
  tag never match one — `9.1.0-alpha.15` does not satisfy `>=9.1.0` — so pin
  the exact prerelease as your dev dependency and keep the stable floor in
  `peerDependencies`.

Never declare `nativescript` as a plain dependency.

`nativescript/contracts` is the entry point extensions import from. It is
side-effect free — importing it does not boot a CLI — and it exports
`defineCommand`, `inject`, the option helpers and the public types.

The `nativescript:extension` keyword makes the package discoverable: the CLI
searches npm for it when it needs to suggest an extension for an unknown command
(see [Suggesting an extension](#suggesting-an-extension-for-an-unknown-command)).

> Extensions are installed per user today, and are available from every project
> on the machine. Installing them as project `devDependencies` — pinned per
> project, reproducible in CI, shared with the team — is the direction this is
> heading; declaring the peer dependency now is what makes an extension ready
> for it.

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

Each key is a command name; each value says where the module implementing it
lives, resolved relative to the extension's root directory. A value is either
the path itself or an object carrying it under `path`:

```json
{
	"nativescript": {
		"commands": {
			"hello|world": { "path": "./dist/commands/hello-world.js" }
		}
	}
}
```

The two forms mean exactly the same thing today. Keys the CLI does not
recognise inside the object form are ignored, so the object can carry
information a later CLI understands without breaking the one you have
installed.

Declaring commands this way is strongly preferred:

- **Per-command lazy loading.** Nothing in the extension is loaded when the CLI
  starts. A command's module is required the first time that command is
  resolved, so `ns build android` never pays the cost of loading an unrelated
  extension. With a large or dependency-heavy extension installed, that is the
  difference between a noticeable startup delay on every command and none.
  Dispatching `ns hello world` loads only `hello-world.js` — not the sibling
  `hello.js`, and not the extension's main entry.
- **Early, named conflict detection.** Two extensions claiming the same command
  name is reported as a warning that names both extensions and the contested
  command, and the extension that claimed it first keeps working. Under the
  legacy shape the same collision surfaces as an opaque
  `module '...' require'd twice.` failure from whichever extension happened to
  load second.
- **The CLI knows what you contribute without running you.** The declared
  command names are what the install suggestion for an unknown command matches
  against, and they are available to the CLI as metadata about the installed
  extension.

Malformed entries are skipped rather than fatal: an entry whose command name is
not a non-empty string, or whose value carries no usable module path, is
reported as a warning naming the extension and the offending entry, and the
extension's remaining commands are still registered.

An empty map opts out of loading entirely:

```json
{
	"nativescript": {
		"commands": {}
	}
}
```

The extension contributes no commands, and — unlike omitting the key — its main
entry is never required. Use it for an extension that only ships documentation
or assets.

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
extension declaring commands this way (or omitting the `commands` key
altogether) is loaded the old way: the CLI `require()`s the package's main entry
on **every** invocation and expects the module's top-level code to register
everything through the injector global.

This path remains supported for published extensions, but it is tracked for
eventual deprecation and new extensions should not use it — declare the map
instead. Run any command with `--log trace` to see which installed extensions
still rely on it, or set `NS_DEPRECATIONS=warn` to have those reports printed
as warnings.

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

`inject()` resolves a CLI service against the injector running the command, and
works anywhere inside `run` up to the first `await`. It is why the peer
dependency above matters: with a second copy of the CLI installed alongside your
extension, `inject()` warns and points at the duplicate.

A definition exported as `module.exports.default` (what a TypeScript or ESM
build emits) is picked up too.

Legacy modules — command classes that register themselves at load time through
the injector global, with parameter-name constructor injection — keep working
when a manifest entry points at them, so existing extensions can adopt the map
without rewriting their commands. Both of those mechanisms are deprecated
(see [dependency-injection.md](dependency-injection.md)); write new modules as
definitions.

If a module named by a manifest entry neither exports a definition nor registers
the command itself, executing that command fails with an error naming the
extension, the command and the module — the entry points at the wrong file, or
the file is not doing what the entry promises.

## Command names

Command names use `|` to express hierarchy, so `"hello|world"` is invoked as
`ns hello world`. Prefixing the last segment with `*` marks a default
subcommand: `"hello|*default"` runs both for `ns hello default` and for a bare
`ns hello`. Names must be lower case — the CLI matches what the user typed in
lower case, so a key with an upper-case letter could never be reached, and is
rejected with a warning.

**The manifest key decides how a command is invoked.** It has to: the CLI routes
`ns hello world` to your module before that module has been loaded, so the key
is the only name it can know. A `name` inside the definition is metadata — it is
what `registerCommandDefinition` uses when a module registers itself, and it is
useful documentation, but a manifest entry overrides it. If the two disagree the
CLI warns, naming both, and runs the command under the manifest key.

An alias is a second entry pointing at the same module:

```json
{
	"nativescript": {
		"commands": {
			"hello|world": "./dist/commands/hello-world.js",
			"hello|w": "./dist/commands/hello-world.js"
		}
	}
}
```

Both names route to the same module, which is loaded once.

## When two extensions want the same command

The first extension to claim a command name keeps it; later claimants are
reported with a warning naming both extensions and the command, and their entry
is skipped. A name the CLI itself provides is never taken over — the extension
is told the command is already provided by the CLI.

"First" is the order extensions are loaded in, which is the order they appear in
the `dependencies` of the profile directory's `extensions/package.json` — npm
keeps that alphabetically sorted, so in practice the alphabetically first
extension name wins. The exception is `ns extension install`: that invocation
loads the freshly installed extension after all the others, so a conflict it
would win on the next invocation goes the other way that one time.

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
