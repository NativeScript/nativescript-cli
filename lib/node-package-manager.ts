///<reference path=".d.ts"/>
"use strict";

import Future = require("fibers/future");
import * as npm from "npm";

interface INpmOpts {
	config?: any;
	subCommandName?: string;
	path?: string;
}

export class NodePackageManager implements INodePackageManager {
	constructor(private $childProcess: IChildProcess,
		private $options: IOptions) { }

	public getCache(): string {
		return npm.cache;
	}

	public load(config?: any): IFuture<void> {
		let future = new Future<void>();
		npm.load(config, (err: Error) => {
			if(err) {
				future.throw(err);
			} else {
				future.return();
			}
		});
		return future;
	}

	public install(packageName: string, pathToSave: string, config?: any): IFuture<any> {
		if(this.$options.ignoreScripts) {
			config = config || {};
			config["ignore-scripts"] = true;
		}

		return this.loadAndExecute("install", [pathToSave, packageName], { config: config });
	}

	public uninstall(packageName: string, config?: any, path?: string): IFuture<any> {
		return this.loadAndExecute("uninstall", [[packageName]], { config, path});
	}

	public cache(packageName: string, version: string, config?: any): IFuture<IDependencyData> {
		// function cache (pkg, ver, where, scrub, cb)
		return this.loadAndExecute("cache", [packageName, version, undefined, false], { subCommandName: "add", config: config });
	}

	public cacheUnpack(packageName: string, version: string, unpackTarget?: string): IFuture<void> {
		// function unpack (pkg, ver, unpackTarget, dMode, fMode, uid, gid, cb)
		return this.loadAndExecute("cache", [packageName, version, unpackTarget, null, null, null, null], { subCommandName: "unpack" });
	}

	public view(packageName: string, propertyName: string): IFuture<any> {
		return this.loadAndExecute("view", [[packageName, propertyName], [false]]);
	}

	public executeNpmCommand(npmCommandName: string, currentWorkingDirectory: string): IFuture<any> {
		return this.$childProcess.exec(npmCommandName, { cwd: currentWorkingDirectory });
	}

	private loadAndExecute(commandName: string, args: any[], opts?: INpmOpts): IFuture<any> {
		return (() => {
			opts = opts || {};
			this.load(opts.config).wait();
			return this.executeCore(commandName, args, opts).wait();
		}).future<any>()();
	}

	private executeCore(commandName: string, args: any[], opts?: INpmOpts): IFuture<any> {
		let future = new Future<any>();
		let oldNpmPath: string = undefined;
		let callback = (err: Error, data: any) => {
			if (oldNpmPath) {
				npm.prefix = oldNpmPath;
			}

			if(err) {
				future.throw(err);
			} else {
				future.return(data);
			}
		};
		args.push(callback);

		if (opts && opts.path) {
			oldNpmPath = npm.prefix;
			npm.prefix = opts.path;
		}

		let subCommandName: string = opts.subCommandName;
		let command = subCommandName ? npm.commands[commandName][subCommandName] : npm.commands[commandName];
		command.apply(this, args);

		return future;
	}
}
$injector.register("npm", NodePackageManager);
