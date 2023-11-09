import { ChildProcess } from "child_process";

export interface IStartService {
	ios: ChildProcess;
	android: ChildProcess;
	start(): void;
	toggleVerbose(): void;

	runIOS(): Promise<void>;
	runAndroid(): Promise<void>;
	stopIOS(): Promise<void>;
	stopAndroid(): Promise<void>;
}
