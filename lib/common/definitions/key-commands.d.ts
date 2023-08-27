export type IKeyCommandPlatform = "Android" | "iOS" | "all";
export type IKeysLowerCase =
	| "a"
	| "b"
	| "c"
	| "d"
	| "e"
	| "f"
	| "g"
	| "h"
	| "i"
	| "j"
	| "k"
	| "l"
	| "m"
	| "n"
	| "o"
	| "p"
	| "q"
	| "r"
	| "s"
	| "t"
	| "u"
	| "v"
	| "w"
	| "x"
	| "y"
	| "z";

export type IValidKeyCommands = IKeysLowerCase | `${Uppercase<IKeysLowerCase>}`;

export interface IKeyCommandHelper {
	attachKeyCommands: (
		platform: IKeyCommandPlatform,
		processType: SupportedProcessType
	) => void;

	addOverride(key: IValidKeyCommands, execute: () => Promise<boolean>);
	removeOverride(key: IValidKeyCommands);
	printCommands(platform: IKeyCommandPlatform): void;
}

export type SupportedProcessType = "start" | "run";

export interface IKeyCommand {
	key: IValidKeyCommands;
	platform: IKeyCommandPlatform;
	description: string;
	willBlockKeyCommandExecution?: boolean;
	execute(platform: string): Promise<void>;
	canExecute?: (processType: SupportedProcessType) => boolean;
}
