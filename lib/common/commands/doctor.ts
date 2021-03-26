import { injector } from "../yok";
import { ICommand, ICommandParameter } from "../definitions/commands";
import { IDoctorService, IProjectHelper } from "../declarations";
import { PlatformTypes } from "../../constants";

export class DoctorCommand implements ICommand {
	constructor(
		private $doctorService: IDoctorService,
		private $projectHelper: IProjectHelper
	) {}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): Promise<void> {
		return this.$doctorService.printWarnings({
			trackResult: false,
			projectDir: this.$projectHelper.projectDir,
			forceCheck: true,
		});
	}
}
injector.registerCommand("doctor|*all", DoctorCommand);

export class DoctorIosCommand implements ICommand {
	constructor(
		private $doctorService: IDoctorService,
		private $projectHelper: IProjectHelper
	) {}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): Promise<void> {
		return this.$doctorService.printWarnings({
			trackResult: false,
			projectDir: this.$projectHelper.projectDir,
			forceCheck: true,
			platform: PlatformTypes.ios,
		});
	}
}

injector.registerCommand("doctor|ios", DoctorIosCommand);

export class DoctorAndroidCommand implements ICommand {
	constructor(
		private $doctorService: IDoctorService,
		private $projectHelper: IProjectHelper
	) {}

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): Promise<void> {
		return this.$doctorService.printWarnings({
			trackResult: false,
			projectDir: this.$projectHelper.projectDir,
			forceCheck: true,
			platform: PlatformTypes.android,
		});
	}
}

injector.registerCommand("doctor|android", DoctorAndroidCommand);
