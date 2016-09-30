import Future = require("fibers/future");
import * as npm from "npm";

interface INpmOpts {
	config?: any;
	subCommandName?: string;
	path?: string;
}

export class NodePackageManager implements INodePackageManager {
	constructor(private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $options: IOptions) { }

	public getCache(): string {
		return npm.cache;
	}

	public load(config?: any): IFuture<void> {
		if (npm.config.loaded) {
			let data = npm.config.sources.cli.data;
			Object.keys(data).forEach(k => delete data[k]);
			if (config) {
				_.assign(data, config);
			}
			return Future.fromResult();
		} else {
			let future = new Future<void>();
			npm.load(config, (err: Error) => {
				if (err) {
					future.throw(err);
				} else {
					future.return();
				}
			});
			return future;
		}
	}

	public install(packageName: string, pathToSave: string, config?: any): IFuture<any> {
		return (() => {
			if (this.$options.disableNpmInstall) {
				return;
			}
			if (this.$options.ignoreScripts) {
				config = config || {};
				config["ignore-scripts"] = true;
			}

			try {
				return this.loadAndExecute("install", [pathToSave, packageName], { config: config }).wait();
			} catch (err) {
				if (err.code === "EPEERINVALID") {
					// Not installed peer dependencies are treated by npm 2 as errors, but npm 3 treats them as warnings.
					// We'll show them as warnings and let the user install them in case they are needed.
					// The strucutre of the error object in such case is:
					//	{ [Error: The package @angular/core@2.1.0-beta.0 does not satisfy its siblings' peerDependencies requirements!]
					//   code: 'EPEERINVALID',
					//   packageName: '@angular/core',
					//   packageVersion: '2.1.0-beta.0',
					//   peersDepending:
					//    { '@angular/common@2.1.0-beta.0': '2.1.0-beta.0',
					//      '@angular/compiler@2.1.0-beta.0': '2.1.0-beta.0',
					//      '@angular/forms@2.1.0-beta.0': '2.1.0-beta.0',
					//      '@angular/http@2.1.0-beta.0': '2.1.0-beta.0',
					//      '@angular/platform-browser@2.1.0-beta.0': '2.1.0-beta.0',
					//      '@angular/platform-browser-dynamic@2.1.0-beta.0': '2.1.0-beta.0',
					//      '@angular/platform-server@2.1.0-beta.0': '2.1.0-beta.0',
					//      '@angular/router@3.1.0-beta.0': '2.1.0-beta.0',
					//      '@ngrx/effects@2.0.0': '^2.0.0',
					//      '@ngrx/store@2.2.1': '^2.0.0',
					//      'ng2-translate@2.5.0': '~2.0.0' } }
					this.$logger.warn(err.message);
					this.$logger.trace("Required peerDependencies are: ", err.peersDepending);
				} else {
					// All other errors should be handled by the caller code.
					throw err;
				}
			}
		}).future<any>()();
	}

	public uninstall(packageName: string, config?: any, path?: string): IFuture<any> {
		return this.loadAndExecute("uninstall", [[packageName]], { config, path });
	}

	public search(filter: string[], silent: boolean): IFuture<any> {
		let args = (<any[]>([filter] || [])).concat(silent);
		return this.loadAndExecute("search", args);
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

			if (err) {
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
