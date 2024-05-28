import { ChildProcess } from "child_process";

export interface IStartService {
	ios: ChildProcess;
	android: ChildProcess;
	start(): void;
	toggleVerbose(): void;

	runIOS(): Promise<void>;
	runVisionOS(): Promise<void>;
	runAndroid(): Promise<void>;
	stopIOS(): Promise<void>;
	stopVisionOS(): Promise<void>;
	stopAndroid(): Promise<void>;
}
