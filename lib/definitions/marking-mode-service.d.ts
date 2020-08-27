interface IMarkingModeService {
	handleMarkingModeFullDeprecation(
		options: IMarkingModeFullDeprecationOptions
	): Promise<void>;
}

interface IMarkingModeFullDeprecationOptions {
	projectDir: string;
	skipWarnings?: boolean;
	forceSwitch?: boolean;
}
