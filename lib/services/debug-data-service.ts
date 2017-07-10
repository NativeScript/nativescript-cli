export class DebugDataService implements IDebugDataService {
	public createDebugData(projectData: IProjectData, options: IDeviceIdentifier): IDebugData {
		return {
			applicationIdentifier: projectData.projectId,
			projectDir: projectData.projectDir,
			deviceIdentifier: options.device,
			projectName: projectData.projectName
		};
	}
}

$injector.register("debugDataService", DebugDataService);
