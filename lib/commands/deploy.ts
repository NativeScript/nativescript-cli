///<reference path="../.d.ts"/>
"use strict";

export class DeployOnDeviceCommand implements ICommand {
	constructor(private $platformService: IPlatformService,
		private $platformCommandParameter: ICommandParameter,
				private $options: IOptions,
				private $errors: IErrors) { }

	execute(args: string[]): IFuture<void> {
		return this.$platformService.deployOnDevice(args[0]);
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if (this.$options.release && (!this.$options.keyStorePath || !this.$options.keyStorePassword || !this.$options.keyStoreAlias || !this.$options.keyStoreAliasPassword)) {
				this.$errors.fail("When producing a release build, you need to specify all --key-store-* options.");
			}
			let res = (args.length === 1) && this.$platformCommandParameter.validate(args[0]).wait();
			return res;
		}).future<boolean>()();
	}

	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("deploy", DeployOnDeviceCommand);
