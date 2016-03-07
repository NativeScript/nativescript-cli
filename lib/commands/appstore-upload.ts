///<reference path="../.d.ts"/>
"use strict";

import {StringCommandParameter} from "../common/command-params";
import * as path from "path";

export class PublishIOS implements ICommand {
	constructor(private $errors: IErrors,
		private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $injector: IInjector,
		private $itmsTransporterService: IITMSTransporterService,
		private $logger: ILogger,
		private $options: IOptions,
		private $prompter: IPrompter,
		private $stringParameterBuilder: IStringParameterBuilder) { }

	public allowedParameters: ICommandParameter[] = [new StringCommandParameter(this.$injector), new StringCommandParameter(this.$injector),
			new StringCommandParameter(this.$injector), new StringCommandParameter(this.$injector)];

	public execute(args: string[]): IFuture<void> {
		return (() => {
			let username = args[0],
				password = args[1],
				mobileProvisionIdentifier = args[2],
				codeSignIdentity = args[3],
				ipaFilePath = this.$options.ipa ? path.resolve(this.$options.ipa) : null;

			if(!username) {
				username = this.$prompter.getString("Apple ID", { allowEmpty: false }).wait();
			}

			if(!password) {
				password = this.$prompter.getPassword("Apple ID password").wait();
			}

			if(!mobileProvisionIdentifier && !ipaFilePath) {
				this.$logger.warn("No mobile provision identifier set. A default mobile provision will be used. You can set one in app/App_Resources/iOS/build.xcconfig");
			}

			if(!codeSignIdentity && !ipaFilePath) {
				this.$logger.warn("No code sign identity set. A default code sign identity will be used. You can set one in app/App_Resources/iOS/build.xcconfig");
			}

			this.$options.release = true;
			this.$itmsTransporterService.upload({
				username,
				password,
				mobileProvisionIdentifier,
				codeSignIdentity,
				ipaFilePath,
				verboseLogging: this.$logger.getLevel() === "TRACE"
			}).wait();
		}).future<void>()();
	}

	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			if (!this.$hostInfo.isDarwin) {
				this.$errors.failWithoutHelp("This command is only available on Mac OS X.");
			}

			return true;
		}).future<boolean>()();
	}
}
$injector.registerCommand(["publish|ios", "appstore|upload"], PublishIOS);
