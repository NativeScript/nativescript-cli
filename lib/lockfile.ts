///<reference path=".d.ts"/>
"use strict";

import Future = require("fibers/future");
import lockfile = require("lockfile");
import path = require("path");
import options = require("./options");

export class LockFile implements ILockFile {
	private static LOCK_FILENAME = path.join(options["profile-dir"], ".lock");
	private static LOCK_EXPIRY_PERIOD_SEC = 180;
	private static LOCK_PARAMS = {
		retryWait: 100,
		retries: LockFile.LOCK_EXPIRY_PERIOD_SEC*10,
		stale: LockFile.LOCK_EXPIRY_PERIOD_SEC*1000
	};

	public lock(): IFuture<void> {
		var future = new Future<void>();
		lockfile.lock(LockFile.LOCK_FILENAME, LockFile.LOCK_PARAMS, (err: Error) => {
			if(err) {
				future.throw(err);
			} else {
				future.return();
			}
		});
		return future;
	}

	public unlock(): IFuture<void> {
		var future = new Future<void>();
		lockfile.unlock(LockFile.LOCK_FILENAME, (err: Error) => {
			if(err) {
				future.throw(err);
			} else {
				future.return();
			}
		});
		return future;
	}
}
$injector.register("lockfile", LockFile);