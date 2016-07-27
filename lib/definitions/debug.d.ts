interface IDebugService {
	debug(shouldBreak?: boolean): IFuture<void>;
	debugStart(): IFuture<void>;
	debugStop(): IFuture<void>
	platform: string;
}