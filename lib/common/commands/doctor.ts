import { $injector } from "../definitions/yok";
import { ICommand, ICommandParameter } from "../definitions/commands";
import { IDoctorService, IProjectHelper } from "../declarations";

export class DoctorCommand implements ICommand {

	constructor(private $doctorService: IDoctorService,
		private $projectHelper: IProjectHelper) { }

	public allowedParameters: ICommandParameter[] = [];

	public execute(args: string[]): Promise<void> {
		return this.$doctorService.printWarnings({ trackResult: false, projectDir: this.$projectHelper.projectDir, forceCheck: true });
	}
}

$injector.registerCommand("doctor", DoctorCommand);
