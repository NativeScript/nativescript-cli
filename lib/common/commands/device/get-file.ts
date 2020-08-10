import { IProjectData } from "../../../definitions/project";
import { IOptions } from "../../../declarations";
import { ICommandParameter, ICommand } from "../../definitions/commands";
import { IErrors } from "../../declarations";
import { injector } from "../../yok";

export class GetFileCommand implements ICommand {
	constructor(private $devicesService: Mobile.IDevicesService,
		private $stringParameter: ICommandParameter,
		private $projectData: IProjectData,
		private $errors: IErrors,
		private $options: IOptions) { }

	public allowedParameters: ICommandParameter[] = [this.$stringParameter, this.$stringParameter];

	public async execute(args: string[]): Promise<void> {
		await this.$devicesService.initialize({ deviceId: this.$options.device, skipInferPlatform: true });
		let appIdentifier = args[1];

		if (!appIdentifier) {
			try {
				this.$projectData.initializeProjectData();
			} catch (err) {
				// ignore the error
			}
			if (!this.$projectData.projectIdentifiers) {
				this.$errors.fail("Please enter application identifier or execute this command in project.");
			}
		}

		const action = async (device: Mobile.IDevice) => {
			appIdentifier = appIdentifier || this.$projectData.projectIdentifiers[device.deviceInfo.platform.toLowerCase()];
			await device.fileSystem.getFile(args[0], appIdentifier, this.$options.file);
		};
		await this.$devicesService.execute(action);
	}
}

injector.registerCommand(["device|get-file", "devices|get-file"], GetFileCommand);
