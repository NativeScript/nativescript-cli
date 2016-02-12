Extending the CLI
================= 

NativeScript CLI allows you to extend its behavior and customize it according to your needs.
Each time the CLI executes a particular command (for example `tns build`) it checks whether you have added any extending hooks and executes them.
Additionally, plugins can use these hooks to control the compilation of the program.

What are the hooks
==================

Hooks can be executable code, Node.js script, or even a directory containing other files. To be executed however, the hooks must be placed under the `hooks` subdirectory of your project.
The hook name must follow a strict scheme, describing:

 - the action being hooked
 - whether the user code must be called before or after the action

For example, to execute your code before the `prepare` command starts, create a file named `before-prepare` and place it in the `hooks` directory.
To execute your code after a command completes, create `after-prepare`.
All file extensions (if present) are accepted but JavaScript files are treated specially, which is explained bellow.
 
The project structure looks like this:

```
my-app/
├── index.js
├── package.json
└── hooks/
    ├── before-prepare.js (this is a Node.js script)
    └── after-prepare (this is an executable file) 
```

To support multiple scripts extending the same action, you ccan create a sub-directory in the `hooks` directory using the naming convention described below.
When you place code files into that folder, the CLI executes each file one after another, but not in a guaranteed order.

```
my-app/
├── index.js
├── package.json
└── hooks/
    └── before-prepare (a directory)
        ├── hook1 (this is an executable file)
        └── hook2 (this is an executable file)
```

Execute hooks as child process
========================

If your hook is an executable file which is not a Node.js code, NativeScript executes it using the normal OS API for creating a child process. This gives you the flexibility to write it in any way you want.
The hook receives three variables in its OS environment:

 - NATIVESCRIPT-COMMANDLINE - the full command line which triggered the hook execution, for example: `/usr/local/bin/node /usr/local/lib/node_modules/nativescript/bin/nativescript-cli.js build android`
 - NATIVESCRIPT-HOOK_FULL_PATH - the full path to the hook file name, for example `/home/user/app/hooks/after-prepare/myhook`
 - NATIVESCRIPT-VERSION - the version of the NativeScript CLI which invokes the hook, for example `1.5.2`

Execute hooks in-process
========================

When your hook is a Node.js script, the CLI executes it in-process. This gives you access to the entire internal state of the CLI and all of its functions.
The CLI assumes that this is a CommonJS module and calls its single exported function with four parameters.
The type of the parameters are described in the .d.ts files which are part of the CLI source code [here](https://github.com/NativeScript/nativescript-cli/tree/master/lib/definitions) and [here](https://github.com/telerik/mobile-cli-lib/tree/master/definitions) 

 - $logger: ILogger. Use the members of this class to show messages to the user cooperating with the CLI internal state.
 - $projectData: IProjectData. Contains data about the project, like project directory, id, dependencies, etc.
 - $usbLiveSyncService:ILiveSyncService. Use this variable to check whether a LiveSync or normal build is in progress.
 - hookArgs: any. Contains all the parameters of the original function in the CLI which is being hooked.
 
The hook must return a Promise. If the hook succeeds, it must fullfil the promise, but the fullfilment value is ignored.
The hook can also reject the promise with an instance of Error. The returned error can have two optional members controlling the CLI:
 
  - stopExecution: boolean - set this to false to let the CLI continue executing this command
  - errorAsWarning: boolean: set this to treat the returned error as warning. The CLI prints the error.message colored as a warning and continues executing the current command
 
If these two members are not set, the CLI prints the returned error colored as fatal error and stops executing the current command.
 
Furthermore, the global variable `$injector: IInjector` gives access to the CLi Dependency Injector, through which all code services are available.

Supported commands for hooking
==============================

Only the `prepare` comand can be hooked. Internally, this command is also invoked during build and livesync. The later commands will execute the prepare hooks at the proper moment of their execution.
