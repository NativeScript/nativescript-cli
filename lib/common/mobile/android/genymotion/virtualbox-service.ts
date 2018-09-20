import * as path from "path";
import { EOL } from "os";
import { cache } from "../../../decorators";
import { getWinRegPropertyValue } from "../../../helpers";

export class VirtualBoxService implements Mobile.IVirtualBoxService {
	constructor(private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $logger: ILogger) { }

	public async listVms(): Promise<Mobile.IVirtualBoxListVmsOutput> {
		let result: ISpawnResult = null;
		let vms: Mobile.IVirtualBoxVm[] = [];
		const vBoxManagePath = await this.getvBoxManagePath();

		if (vBoxManagePath) {
			result = await this.$childProcess.trySpawnFromCloseEvent(vBoxManagePath, ["list", "vms"]);
			if (result && result.stdout) {
				vms = result.stdout
					.split(EOL)
					.filter(row => !!row)
					.map(row => {
						// Example row: "Google Nexus 4 - 5.0.0 - API 21 - 768x1280" {9d9beef2-cc60-4a54-bcc0-cc1dbf89811f}
						const [rawName, rawId] = row.split('" ');
						const id = rawId.substr(1, rawId.length - 2);
						const name = rawName.substr(1, rawName.length - 1);
						return { id, name };
					});
			}
		}

		return { vms, error: result && result.stderr };
	}

	public async enumerateGuestProperties(id: string): Promise<Mobile.IVirtualBoxEnumerateGuestPropertiesOutput> {
		let result: ISpawnResult = null;
		const vBoxManagePath = await this.getvBoxManagePath();

		if (vBoxManagePath) {
			result = await this.$childProcess.trySpawnFromCloseEvent(vBoxManagePath, ["guestproperty", "enumerate", id]);
		}

		return { properties: result && result.stdout, error: result && result.stderr };
	}

	private async getvBoxManageSearchPaths(): Promise<IDictionary<string[]>> {
		const searchPaths = {
			darwin: ["/usr/local/bin"],
			linux: [
				"/opt",
				"/opt/local",
				"/usr",
				"/usr/local",
				"~"
			],
			win32: [
				"%ProgramFiles%\\Oracle\\VirtualBox",
				"%ProgramFiles(x86)%\\Oracle\\VirtualBox"
			]
		};

		if (this.$hostInfo.isWindows) {
			let searchPath: any = null;

			try {
				/* This can be used as interface!!!!
					arch:null
					hive:"HKLM"
					host:""
					key:"\Software\Oracle\VirtualBox"
					name:"InstallDir"
					type:"REG_SZ"
					value:"C:\Program Files\Oracle\VirtualBox\"
				*/
				const result: any = await getWinRegPropertyValue("\\Software\\Oracle\\VirtualBox", "InstallDir");
				searchPath = result && result.value ? result.value : null;
			} catch (err) {
				this.$logger.trace(`Error while trying to get InstallDir property for \\Software\\Oracle\\VirtualBox. More info: ${err}.`);
			}

			if (searchPath && !_.includes(searchPaths["win32"], searchPath)) {
				searchPaths["win32"].unshift(searchPath);
			}
		}

		return searchPaths;
	}

	private get vBoxManageExecutableNames(): IDictionary<string> {
		return {
			darwin: "VBoxManage",
			linux: "VBoxManage",
			win32: "VBoxManage.exe"
		};
	}

	@cache()
	private async getvBoxManagePath(): Promise<string> {
		const searchPaths = (await this.getvBoxManageSearchPaths())[process.platform];
		const result = searchPaths
			.map(searchPath => path.join(searchPath, this.vBoxManageExecutableNames[process.platform]))
			.find(searchPath => this.$fs.exists(searchPath));
		return result;
	}
}
$injector.register("virtualBoxService", VirtualBoxService);
