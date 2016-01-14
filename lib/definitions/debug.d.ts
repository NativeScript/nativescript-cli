interface IDebugService {
	debug(): IFuture<void>;
	debugStart(): IFuture<void>;
	platform: string;
}