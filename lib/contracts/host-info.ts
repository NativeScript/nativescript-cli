import { Contract } from "../common/di/contract";

/**
 * Describes the host operating system the CLI runs on.
 */
@Contract({ name: "hostInfo" })
export abstract class HostInfo {
	abstract isWindows: boolean;
	abstract isWindows64: boolean;
	abstract isWindows32: boolean;
	abstract isDarwin: boolean;
	abstract isLinux: boolean;
	abstract isLinux64: boolean;

	abstract dotNetVersion(): Promise<string>;

	abstract isDotNet40Installed(message: string): Promise<boolean>;

	abstract getMacOSVersion(): Promise<string>;
}
