import { IDictionary } from "../common/declarations";
import * as _ from "lodash";

export class LiveSyncProcessDataService implements ILiveSyncProcessDataService {
	protected processes: IDictionary<ILiveSyncProcessData> = {};

	public persistData(projectDir: string, deviceDescriptors: ILiveSyncDeviceDescriptor[], platforms: string[]): void {
		this.processes[projectDir] = this.processes[projectDir] || Object.create(null);
		this.processes[projectDir].actionsChain = this.processes[projectDir].actionsChain || Promise.resolve();
		this.processes[projectDir].currentSyncAction = this.processes[projectDir].actionsChain;
		this.processes[projectDir].isStopped = false;
		this.processes[projectDir].platforms = platforms;

		const currentDeviceDescriptors = this.getDeviceDescriptors(projectDir);
		this.processes[projectDir].deviceDescriptors = _.uniqBy(currentDeviceDescriptors.concat(deviceDescriptors), "identifier");
	}

	public getPersistedData(projectDir: string): ILiveSyncProcessData {
		return this.processes[projectDir];
	}

	public getDeviceDescriptors(projectDir: string): ILiveSyncDeviceDescriptor[] {
		const liveSyncProcessesInfo = this.processes[projectDir] || <ILiveSyncProcessData>{};
		const currentDescriptors = liveSyncProcessesInfo.deviceDescriptors;
		return currentDescriptors || [];
	}

	public hasDeviceDescriptors(projectDir: string): boolean {
		const deviceDescriptors = this.getDeviceDescriptors(projectDir);
		return !!deviceDescriptors.length;
	}

	public getAllPersistedData() {
		return this.processes;
	}

	public getPlatforms(projectDir: string): string[] {
		const liveSyncProcessesInfo = this.processes[projectDir] || <ILiveSyncProcessData>{};
		const currentPlatforms = liveSyncProcessesInfo.platforms;
		return currentPlatforms || [];
	}
}
$injector.register("liveSyncProcessDataService", LiveSyncProcessDataService);
