///<reference path=".d.ts"/>

import npm = require("npm");
import Future = require("fibers/future");
import shell = require("shelljs");

export class NodePackageManager implements INodePackageManager {
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

	public install(where: string, what: string): IFuture<any> {
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
}
$injector.register("npm", NodePackageManager);
