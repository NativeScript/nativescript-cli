interface IDebugService {
	debug(shouldBreak?: boolean): IFuture<void>;
	debugStart(): IFuture<void>;
	platform: string;
}