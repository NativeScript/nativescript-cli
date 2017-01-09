interface IDebugService {
	debug(shouldBreak?: boolean): Promise<void>;
	debugStart(): Promise<void>;
	debugStop(): Promise<void>
	platform: string;
}