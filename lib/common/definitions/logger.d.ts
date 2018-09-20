interface ILogger {
	setLevel(level: string): void;
	getLevel(): string;
	fatal(formatStr?: any, ...args: any[]): void;
	error(formatStr?: any, ...args: any[]): void;
	warn(formatStr?: any, ...args: any[]): void;
	warnWithLabel(formatStr?: any, ...args: any[]): void;
	info(formatStr?: any, ...args: any[]): void;
	debug(formatStr?: any, ...args: any[]): void;
	trace(formatStr?: any, ...args: any[]): void;
	printMarkdown(...args: any[]): void;

	out(formatStr?: any, ...args: any[]): void;
	write(...args: any[]): void;

	prepare(item: any): string;
	printInfoMessageOnSameLine(message: string): void;
	printMsgWithTimeout(message: string, timeout: number): Promise<void>;
}
