interface ITerminalSpinnerService {
	createSpinner(spinnerOptions?: ITerminalSpinnerOptions): ITerminalSpinner;
	execute<T>(
		spinnerOptions: ITerminalSpinnerOptions,
		action: () => Promise<T>
	): Promise<T>;
}

type SpinnerName =
	| "dots"
	| "dots2"
	| "dots3"
	| "dots4"
	| "dots5"
	| "dots6"
	| "dots7"
	| "dots8"
	| "dots9"
	| "dots10"
	| "dots11"
	| "dots12"
	| "line"
	| "line2"
	| "pipe"
	| "simpleDots"
	| "simpleDotsScrolling"
	| "star"
	| "star2"
	| "flip"
	| "hamburger"
	| "growVertical"
	| "growHorizontal"
	| "balloon"
	| "balloon2"
	| "noise"
	| "bounce"
	| "boxBounce"
	| "boxBounce2"
	| "triangle"
	| "arc"
	| "circle"
	| "squareCorners"
	| "circleQuarters"
	| "circleHalves"
	| "squish"
	| "toggle"
	| "toggle2"
	| "toggle3"
	| "toggle4"
	| "toggle5"
	| "toggle6"
	| "toggle7"
	| "toggle8"
	| "toggle9"
	| "toggle10"
	| "toggle11"
	| "toggle12"
	| "toggle13"
	| "arrow"
	| "arrow2"
	| "arrow3"
	| "bouncingBar"
	| "bouncingBall"
	| "smiley"
	| "monkey"
	| "hearts"
	| "clock"
	| "earth"
	| "moon"
	| "runner"
	| "pong"
	| "shark"
	| "dqpb";

interface Spinner {
	interval?: number;
	frames: string[];
}

interface ITerminalSpinner {
	text: string;
	start(text?: string): ITerminalSpinner;
	stop(): ITerminalSpinner;
	succeed(text?: string): ITerminalSpinner;
	fail(text?: string): ITerminalSpinner;
	warn(text?: string): ITerminalSpinner;
	info(text?: string): ITerminalSpinner;
	clear(): ITerminalSpinner;
	render(): ITerminalSpinner;
	frame(): ITerminalSpinner;
}

interface ITerminalSpinnerOptions {
	text?: string;
	spinner?: SpinnerName | Spinner;
	color?:
		| "black"
		| "red"
		| "green"
		| "yellow"
		| "blue"
		| "magenta"
		| "cyan"
		| "white"
		| "gray";
	interval?: number;
	stream?: NodeJS.WritableStream;
	enabled?: boolean;
}
