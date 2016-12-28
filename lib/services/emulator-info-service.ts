import * as path from "path";
let Table = require("cli-table");

class EmulatorInfoService implements IEmulatorInfoService {

    constructor(
        private $mobileHelper: Mobile.IMobileHelper,
        private $childProcess: IChildProcess,
        private $logger: ILogger) {}

    public listAvailableEmulators(platform: string): IFuture<void> {
		return (() => {
            let emulators: IEmulatorInfo[] = [];
            if (!platform || this.$mobileHelper.isiOSPlatform(platform)) {
                emulators = emulators.concat(this.getiOSEmulators());
			}
            if (!platform || this.$mobileHelper.isAndroidPlatform(platform)) {
                emulators = emulators.concat(this.getAndroidEmulators());
			}
            this.outputEmulators("\nAvailable emulators", emulators);
            this.$logger.out("\nConnected devices & emulators");
            $injector.resolveCommand("device").execute(platform ? [platform] : []).wait();
		}).future<void>()();
    }

    public containsEmulator(platform: string, emulator: string): boolean {
        if (!platform || this.$mobileHelper.isiOSPlatform(platform)) {
            let emulators = this.getiOSEmulators();
            if (_.find(emulators, (emulatorInfo) => emulatorInfo.id === emulator)) {
                return true;
            }
        }
        if (!platform || this.$mobileHelper.isAndroidPlatform(platform)) {
            let emulators = this.getAndroidEmulators();
            if (_.find(emulators, (emulatorInfo) => emulatorInfo.id === emulator)) {
                return true;
            }
        }
        return false;
    }

    private outputEmulators(title: string, emulators: IEmulatorInfo[]) {
        this.$logger.out(title);
        let table: any = this.createTable(["Device Name", "Platform", "Version", "Device Identifier"], []);
        let index = 1;
        for (let info of emulators) {
            table.push([info.name, info.platform, info.version, info.id]);
        }
        this.$logger.out(table.toString());
    }

    private getiOSEmulators(): IEmulatorInfo[] {
        let text: string = this.$childProcess.exec("instruments -s devices").wait();
        let lines = text.split("\n");
        let emulators: IEmulatorInfo[] = [];
        for (let line of lines) {
            if (line.indexOf("Simulator") === -1) {
                continue;
            }
            let idIndex = line.indexOf("[");
            let endOfName = line.lastIndexOf("(", idIndex);
            if (endOfName !== -1) {
                let name = line.substring(0, endOfName-1);
                let versionIndex = name.indexOf("+") > 0 ? line.indexOf("(") : endOfName;
                let endOfVersion = line.indexOf(")", versionIndex);
                name = line.substring(0, endOfVersion+1).trim();
                let version = line.substring(versionIndex+1, endOfVersion);
                let endIdIndex = line.indexOf("]", idIndex);
                let id = line.substring(idIndex+1, endIdIndex);
                emulators.push({
                    name: name,
                    version: version,
                    id: id,
                    platform: "iOS",
                    type: "Simulator"
                });
            }
        }
        return emulators;
    }

    private getAndroidEmulators(): IEmulatorInfo[] {
        let androidPath = path.join(process.env.ANDROID_HOME, "tools", "android");
        let text:string = this.$childProcess.exec(`${androidPath} list avd`).wait();
        let notLoadedIndex = text.indexOf("The following");
        if (notLoadedIndex > 0) {
            text = text.substring(0, notLoadedIndex);
        }
        let textBlocks = text.split("---------");
        let emulators: IEmulatorInfo[] = [];
        for (let block of textBlocks) {
            let lines = block.split("\n");
            let info:IEmulatorInfo = { name: "", version: "", id: "",  platform: "Android", type: "Emulator" };
            for (let line of lines) {
                if (line.indexOf("Target") >= 0) {
                    info.version = line.substring(line.indexOf(":")+1).replace("Android", "").trim();
                }
                if (line.indexOf("Name") >= 0) {
                    info.id = line.substring(line.indexOf(":")+1).trim();
                }
                if (line.indexOf("Device") >= 0) {
                    info.name = line.substring(line.indexOf(":")+1).trim();
                }
            }
            emulators.push(info);
        }
        return emulators;
    }

    private createTable(headers: string[], data: string[][]): any {
        let table = new Table({
            head: headers,
            chars: { "mid": "", "left-mid": "", "mid-mid": "", "right-mid": "" }
        });
        _.forEach(data, row => table.push(row));
        return table;
    }
}
$injector.register("emulatorInfoService", EmulatorInfoService);
