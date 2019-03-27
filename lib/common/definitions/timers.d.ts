interface ITimers {
	setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timer;
}