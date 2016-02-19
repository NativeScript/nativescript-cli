Extending the CLI
================= 

The NativeScript CLI lets you extend its behavior and customize it to fit your needs by using [hooks](https://en.wikipedia.org/wiki/Hooking).

When you run one of the [extendable commands](#commands-with-hooking-support) (for example, `tns build`), the CLI checks for hooks and executes them. Plugins can also use hooks to control the compilation of the application package.

## Hooks in the NativeScript CLI

For the NativeScript CLI to execute your hooks, you must place them in the `hooks` subdirectory of your project and name them using a specific convention. Your hooks might be executable code, a Node.js script, or a directory containing Node.js scripts or executable code. All file extensions are supported but JavaScript files are treated [differently](#execute-hooks-in-process).

You can attach the hook before or after `prepare` operations or to `--watch` operations. 

Note that `watch` hooks can be executed only at the time of running `--watch` operations. The `watch` hooks are the last thing executed before launching the file system watcher which tracks for changes to your code.

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
* If you want to attach a hook for `--watch` operations, you must place the hook in the root of the `hooks` subdirectory. The file must be named `watch`. For example:

    ```
    my-app/
    ├── index.js
    ├── package.json
    └── hooks/
        └── watch.js (this is a Node.js script)
    ```
* If you want to attach multiple hooks for `--watch` operations, you must place them inside a `watch` subdirectory of the `hooks` subdirectory. You can specify any meaningful name for the the hooks inside the subdirectory. For example:

    ```
    my-app/
    ├── index.js
    ├── package.json
    └── hooks/
        └── watch (a directory)
            ├── hook1 (this is an executable file)
            └── hook2 (this is an executable file)
    ```

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

The CLI assumes that this is a CommonJS module and calls its single exported function with four parameters. The type of the parameters is described in the `.d.ts` files which are part of the CLI source code  [here](https://github.com/NativeScript/nativescript-cli/tree/master/lib/definitions) and  [here](https://github.com/telerik/mobile-cli-lib/tree/master/definitions).

Parameter | Type | Description
---|---|---
`$logger` | ILogger | Use the members of this class to show messages to the user cooperating with the CLI internal state.
`$projectData` | IProjectData | Contains data about the project, such as project directory, ID, dependencies, etc.
`$usbLiveSyncService` | ILiveSyncService | Use this variable to check whether a LiveSync or normal build is in progress.
`hookArgs` | Any | Contains all the parameters of the original function in the CLI which is being hooked.
 
The hook must return a Promise. If the hook succeeds, it must fullfil the promise, but the fullfilment value is ignored.
The hook can also reject the promise with an instance of Error. The returned error can have two optional members controlling the CLI.
 
Member | Type | Description
---|---|---
`stopExecution` | Boolean | Set this to `false` to let the CLI continue executing this command.
`errorAsWarning` | Boolean | Set this to treat the returned error as warning. The CLI prints the error.message colored as a warning and continues executing the current command.
 
If these two members are not set, the CLI prints the returned error colored as fatal error and stops executing the current command.
 
Furthermore, the global variable `$injector` of type `IInjector` provides access to the CLI Dependency Injector, through which all code services are available.

Commands with Hooking Support
==============================

The only two operations to which you can attach hooks are `prepare` operations and `--watch` operations.

The NativeScriot CLI executes hooks attached to `prepare` when you run the following commands:

* `tns prepare <Platform>`
* `tns build <Platform>`
* `tns deploy <Platform>`
* `tns run <Platform>`
* `tns livesync <Platform>`
* `tns test <Platform>`

The NativeScriot CLI executes hooks attached to `--watch` operations when you run the following commands:

* `tns test <Platform>` with the `--watch` option.
* `tns livesync <Platform>` with the `--watch` option.
