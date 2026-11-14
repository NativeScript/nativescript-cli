import * as fs from "fs";
import { IOSSimulatorFileSystem } from "../simulator/ios-simulator-file-system";
import { IFileSystem } from "../../../declarations";

/**
 * The installed app is a directory on this machine, so every transfer is a
 * local copy, the same as on a simulator.
 */
export class IOSMacFileSystem extends IOSSimulatorFileSystem {
	constructor($fs: IFileSystem, $logger: ILogger) {
		super(null, $fs, $logger);
	}

	public async listFiles(devicePath: string): Promise<any> {
		return fs.readdirSync(devicePath);
	}
}
