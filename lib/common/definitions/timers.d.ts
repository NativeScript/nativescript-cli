interface ITimers {
	setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timer;
	clearInterval(intervalId: NodeJS.Timer): void;
}