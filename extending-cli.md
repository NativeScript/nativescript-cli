Extending the CLI
================= 

The NativeScript CLI lets you extend its behavior and customize it to fit your needs by using [hooks](https://en.wikipedia.org/wiki/Hooking).

When you run one of the [extendable commands](#commands-with-hooking-support) (for example, `ns build`), the CLI checks for hooks and executes them. Plugins can also use hooks to control the compilation of the application package.

## Hooks in the NativeScript CLI

For the NativeScript CLI to execute your hooks, you must place them in the `hooks` subdirectory of your project and name them using a specific convention. Your hooks might be executable code, a Node.js script, or a directory containing Node.js scripts or executable code. All file extensions are supported but JavaScript files are treated [differently](#execute-hooks-in-process).

You can attach the hook before or after `prepare` operations or to `--watch` operations. 

Note that `watch` hooks can be executed only at the time of running `--watch` operations. The `before-watch` hooks are the last thing executed before launching the file system watcher which tracks for changes to your code.

Your hooks must conform to the following naming and placement conventions:

* If you want to attach a single before or after hook to `prepare` operations, you must place the hook in the root of the `hooks` subdirectory. The file must be named `before-prepare` or `after-prepare`. For example:

    ```
    my-app/
    ├── index.js
    ├── package.json
    └── hooks/
        ├── before-prepare.js (this is a Node.js script)
        └── after-prepare (this is an executable file) 
    ```
* If you want to attach multiple hooks before or after a prepare operation, you must place them inside a `before-prepare` or `after-prepare` subdirectory of the `hooks` subdirectory. You can specify any meaningful name for the the hooks inside the subdirectory. For example:

    ```
    my-app/
    ├── index.js
    ├── package.json
    └── hooks/
        └── before-prepare (a directory)
            ├── hook1 (this is an executable file)
            └── hook2 (this is an executable file)
    ```
* If you want to attach a hook for `--watch` operations, you must place the hook in the root of the `hooks` subdirectory. The file must be named `before-watch` or `after-watch`. For example:

    ```
    my-app/
    ├── index.js
    ├── package.json
    └── hooks/
        └── before-watch.js (this is a Node.js script)
    ```
* If you want to attach multiple hooks for `--watch` operations, you must place them inside a `before-watch` or `after-watch` subdirectory of the `hooks` subdirectory. You can specify any meaningful name for the the hooks inside the subdirectory. For example:

    ```
    my-app/
    ├── index.js
    ├── package.json
    └── hooks/
        └── before-watch (a directory)
            ├── hook1 (this is an executable file)
            └── hook2 (this is an executable file)
    ```

    A file named plainly `watch` is never executed: like every other hook point, the watch hooks are addressed by the `before-`/`after-` names above.

> **NOTE:** When multiple hooks are attached to a single event (i.e. multiple hooks are stored in dedicated subdirectories), at the specified time, the CLI executes each hook one by one. However, the order of hook execution is not strict and might change over command executions.

Execute Hooks as Child Process
========================

If your hook is an executable file which is not a Node.js JavaScript file, the CLI executes it using the normal OS API for creating a child process. This gives you the flexibility to write it in any way you want.

The hook receives the following three variables in its OS environment.

Variable | Description | Sample Value
---|---|---
`NATIVESCRIPT-COMMANDLINE` | The complete command line which triggered the hook execution. | `/usr/local/bin/node /usr/local/lib/node_modules/nativescript/bin/nativescript-cli.js build android`
`NATIVESCRIPT-HOOK_FULL_PATH` | The complete command line to the hook file name. | `/home/user/app/hooks/after-prepare/myhook`
`NATIVESCRIPT-VERSION` | the version of the NativeScript CLI which invokes the hook. | `1.5.2`

Execute Hooks In-Process
========================

When your hook is a Node.js script, the CLI executes it in-process. This gives you access to the entire internal state of the CLI and all of its functions.

The CLI assumes that this is a CommonJS module and calls the hook it exports — either a hook definition (see below) or a plain function.

## Writing a hook

Export a hook definition built with `defineHook`. It takes the hook point in the usual naming convention (`before-prepare`, `after-watch`) and a `run` handler that receives a context object.

```JavaScript
const { defineHook, inject, DoctorService } = require("nativescript/contracts");

module.exports = defineHook({
	name: "before-prepare",
	run: async (ctx) => {
		const doctorService = inject(DoctorService);
		await doctorService.canExecuteLocalBuild();
	},
});
```

`defineHook(name, run)` is shorthand for the same definition:

```JavaScript
module.exports = defineHook("before-prepare", async (ctx) => { /* ... */ });
```

`defineHook` validates its input immediately: a missing or non-string `name`, a missing or non-function `run`, and unknown fields all throw at definition time, naming the definition and both accepted forms.

The `name` decides when the hook fires and must match the hook point the file is placed at. A definition whose `name` disagrees with its location is **skipped with a warning** rather than run at the wrong point. Export exactly one definition (or one plain function) per file — an array export is rejected.

Services come from `inject()` — the same API used everywhere else (see [dependency-injection.md](dependency-injection.md)):

* `inject()` is valid in the synchronous part of the handler — not after an `await`. Resolve what you need up front; for late lookups, grab the container first: `const injector = inject(Injector)` (`Injector` is exported from `nativescript/contracts` too), then `injector.get(...)` later.
* Tokens resolve by class first and by their canonical name on a miss, so this works even if your dependency tree carries its own copy of `nativescript` — a duplicated token class still resolves to the running CLI's service.
* Only a first tranche of services has typed tokens so far ([dependency-injection.md](dependency-injection.md#available-contracts) lists them); a service without a token is reachable by its registry name — `inject("logger")` — as a migration bridge.
* If you build your hook in TypeScript, add `nativescript` as a `devDependency` and import the same names: `import { defineHook, inject, DoctorService } from "nativescript/contracts"`. An `.mjs` hook can `export default defineHook(...)`.

### `ctx.payload`

`ctx.payload` holds the parameters of the CLI operation being hooked; its shape depends on the hook point. It is the CLI's own object, so mutating it influences the operation:

```JavaScript
module.exports = defineHook("before-build-task-args", (ctx) => {
	ctx.payload.args.push("--offline");
});
```

Not every invocation carries one. The `before-<command>`/`after-<command>` hooks fired around command dispatch (`before-build`, `after-run`, …) pass no arguments at all, so `ctx.payload` is `undefined` there. Treat it as optional — in TypeScript it is typed `TPayload | undefined`:

```TypeScript
import { defineHook } from "nativescript/contracts";

export default defineHook<{ args: string[] }>("before-build-task-args", (ctx) => {
	ctx.payload?.args.push("--offline");
});
```

### `ctx.wrap(middleware)`

`ctx.wrap(middleware)` puts a middleware around the hooked method. The middleware receives the method's arguments and a `next` callback; call `next` to continue, or return without calling it to short-circuit the method entirely.

```JavaScript
module.exports = defineHook("before-prepare", (ctx) => {
	ctx.wrap(async (args, next) => {
		const result = await next(...args);
		return result;
	});
});
```

Only a hook point that actually folds middlewares around a method can honor `wrap()`, so it is available **only in the before-phase of the wrappable hook points** listed below. Calling it anywhere else — from any `after-` hook, or from a before-hook at a non-wrappable point — throws an error naming the hook point instead of registering a middleware that would never run.

The wrappable hook points are:

`before-buildAndroid` · `before-buildAndroidPlugin` · `before-buildIOS` · `before-checkEnvironment` · `before-checkForChanges` · `before-install` · `before-prepare` · `before-prepareNativeApp` · `before-resolveCommand` · `before-watch` · `before-watchPatterns`

### `ctx.abort(message)`

`ctx.abort(message)` stops the hook and fails the command. Pass `{ asWarning: true }` to print the message as a warning and let the command continue instead. The message is required in practice — calling `abort()` without one falls back to a message naming the hook point.

```JavaScript
module.exports = defineHook("before-prepare", (ctx) => {
	ctx.abort("Nothing to prepare.", { asWarning: true });
});
```

### Plain function hooks

Exporting a plain function is still supported. It runs in an injection context too, so `inject()` works the same way; declare a `hookArgs` parameter if you need the payload.

```JavaScript
const { inject, DoctorService } = require("nativescript/contracts");

module.exports = function (hookArgs) {
	const doctorService = inject(DoctorService);
	return doctorService.canExecuteLocalBuild();
};
```

## The hook contract

The hook must return a Promise. If the hook succeeds, it must fullfil the promise, but the fullfilment value is ignored.
The hook can also reject the promise with an instance of Error. The returned error can carry two members that together downgrade the rejection to a warning.

Member | Type | Description
---|---|---
`errorAsWarning` | Boolean | Must be exactly `true`. The CLI prints the error.message colored as a warning and continues executing the current command.
`stopExecution` | Boolean | Must be present and of type Boolean. It only enables the check — setting it alone, with either value, changes nothing.

**Both** members are required: the CLI continues only when `errorAsWarning === true` *and* `stopExecution` is a Boolean. Otherwise it prints the returned error colored as a fatal error and stops executing the current command.

A plain-function hook can also return a function, which the CLI folds into a middleware chain around the hooked method.

With `defineHook` neither convention is needed, and neither applies: `ctx.abort` replaces throwing an error carrying `stopExecution`/`errorAsWarning`, and `ctx.wrap` replaces returning a function. A definition whose `run` returns a function is warned about — the returned function is not used as a middleware.

## Legacy: parameter-name injection

Historically, a hook received CLI services by naming them as parameters: the CLI parses the exported function's parameter names and injects the service registered under each name. Existing hooks written this way keep working unchanged, but **new hooks should use the pattern above** — parameter-name service injection is slated for deprecation, and hooks that use it are reported through the CLI's deprecation tracer (visible with `--log trace`, or as warnings with `NS_DEPRECATIONS=warn`).

Parameter | Type | Description
---|---|---
`$logger` | ILogger | Use the members of this class to show messages to the user cooperating with the CLI internal state.
`$projectData` | IProjectData | Contains data about the project, such as project directory, ID, dependencies, etc.
`$usbLiveSyncService` | ILiveSyncService | Use this variable to check whether a LiveSync or normal build is in progress.
`hookArgs` | Any | Contains all the parameters of the original function in the CLI which is being hooked.

The type of the parameters is described in the `.d.ts` files which are part of the CLI source code [here](https://github.com/NativeScript/nativescript-cli/tree/master/lib/definitions). Any registered service name is injectable, not only the ones listed; the global variable `$injector` of type `IInjector` likewise remains available. A parameter the CLI cannot resolve causes the hook to be skipped with a warning.

Commands with Hooking Support
==============================

The only two operations to which you can attach hooks are `prepare` operations and `--watch` operations.

The NativeScript CLI executes hooks attached to `prepare` when you run the following commands:

* `ns prepare <Platform>`
* `ns build <Platform>`
* `ns deploy <Platform>`
* `ns run <Platform>`
* `ns livesync <Platform>`
* `ns test <Platform>`

The NativeScript CLI executes hooks attached to `--watch` operations when you run the following commands:

* `ns test <Platform>` with the `--watch` option.
* `ns livesync <Platform>` with the `--watch` option.
