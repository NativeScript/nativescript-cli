///<reference path=".d.ts"/>

import npm = require("npm");
import Future = require("fibers/future");
import shell = require("shelljs");
import path = require("path");

export class NodePackageManager implements INodePackageManager {
	private static NPM_LOAD_FAILED = "Failed to retrieve data from npm. Please try again a little bit later.";

	constructor(private $logger: ILogger,
		private $errors: IErrors) { }

	public get cache(): string {
		return npm.cache;
	}

	public load(config?: any): IFuture<void> {
		var future = new Future<void>();
		npm.load(config, (err) => {
			if(err) {
				future.throw(err);
			} else {
				future.return();
			}
		});
		return future;
	}

	public install(packageName: string, pathToSave?: string): IFuture<string> {
		return (() => {
			var action = (packageName: string) => {
				pathToSave = pathToSave || npm.cache;
				this.installCore(pathToSave, packageName).wait();
			};

			this.tryExecuteAction(action, packageName).wait();

			return path.join(pathToSave, "node_modules", packageName);

		}).future<string>()();
	}

	private installCore(where: string, what: string): IFuture<any> {
		var future = new Future<any>();
		npm.commands["install"](where, what, (err, data) => {
			if(err) {
				future.throw(err);
			} else {
				future.return(data);
			}
		});
		return future;
	}

	private tryExecuteAction(action: (...args: any[]) => void, ...args: any[]): IFuture<void> {
		return (() => {
			try {
				this.load().wait(); // It's obligatory to execute load before whatever npm function
				action.apply(null, args);
			} catch(error) {
				this.$logger.debug(error);
				this.$errors.fail(NodePackageManager.NPM_LOAD_FAILED);
			}
		}).future<void>()();
	}
}
$injector.register("npm", NodePackageManager);
