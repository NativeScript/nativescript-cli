///<reference path=".d.ts"/>

import npm = require("npm");
import Future = require("fibers/future");
import shell = require("shelljs");

export class NodePackageManager implements INodePackageManager {
	public get cache(): string {
		return npm.cache;
	}

	public load(config: any): IFuture<void> {
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

	public executeCommand(command: string, arguments: string[]): IFuture<any> {
		var future = new Future<any>();
		npm.commands[command](arguments, (err, data) => {
			if(err) {
				future.throw(err);
			} else {
				future.return(data);
			}
		});
		return future;
	}
}
$injector.register("nodePackageManager", NodePackageManager);