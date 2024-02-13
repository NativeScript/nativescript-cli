export type IKeyCommandPlatform = "Android" | "iOS" | "visionOS" | "all";
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

export type IKeysUpperCase = Uppercase<IKeysLowerCase>;

export const enum SpecialKeys {
	CtrlC = "\u0003",
	QuestionMark = "?",
}

export type IKeysSpecial = `${SpecialKeys}`;

export type IValidKeyName = IKeysLowerCase | IKeysUpperCase | IKeysSpecial;

export interface IKeyCommandHelper {
	attachKeyCommands: (
		platform: IKeyCommandPlatform,
		processType: SupportedProcessType
	) => void;

	addOverride(key: IValidKeyName, execute: () => Promise<boolean>);
	removeOverride(key: IValidKeyName);
	printCommands(platform: IKeyCommandPlatform): void;
}

export type SupportedProcessType = "start" | "run";

export interface IKeyCommand {
	key: IValidKeyName;
	platform: IKeyCommandPlatform;
	description: string;
	willBlockKeyCommandExecution?: boolean;
	execute(platform: string): Promise<void>;
	canExecute?: (processType: SupportedProcessType) => boolean;
}
