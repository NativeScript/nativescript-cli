///<reference path="../.d.ts"/>
"use strict";

export class LivesyncCommand implements ICommand {
	constructor(private $logger: ILogger,
		private $usbLiveSyncService: IUsbLiveSyncService,
		private $mobileHelper: Mobile.IMobileHelper) { }

	public execute(args: string[]): IFuture<void> {
		return this.$usbLiveSyncService.liveSync(args[0]);
	}
	
	public canExecute(args: string[]): IFuture<boolean> {
		return (() => {
			let platform = args[0];
			if(platform) {
				 return _.contains(this.$mobileHelper.platformNames, this.$mobileHelper.normalizePlatformName(platform));
			}
			
			return true;
		}).future<boolean>()();
	}
	
	allowedParameters: ICommandParameter[] = [];
}
$injector.registerCommand("livesync", LivesyncCommand);