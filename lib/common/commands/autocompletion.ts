import * as helpers from "../helpers";

export class AutoCompleteCommand implements ICommand {
	constructor(private $autoCompletionService: IAutoCompletionService,
		private $logger: ILogger,
		private $prompter: IPrompter) {
	}

	public disableAnalytics = true;
	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		if (helpers.isInteractive()) {
			if (this.$autoCompletionService.isAutoCompletionEnabled()) {
				if (this.$autoCompletionService.isObsoleteAutoCompletionEnabled()) {
					// obsolete autocompletion is enabled, update it to the new one:
					await this.$autoCompletionService.enableAutoCompletion();
				} else {
					this.$logger.info("Autocompletion is already enabled");
				}
			} else {
				this.$logger.out("If you are using bash or zsh, you can enable command-line completion.");
				const message = "Do you want to enable it now?";

				const autoCompetionStatus = await this.$prompter.confirm(message, () => true);
				if (autoCompetionStatus) {
					await this.$autoCompletionService.enableAutoCompletion();
				} else {
					// make sure we've removed all autocompletion code from all shell profiles
					this.$autoCompletionService.disableAutoCompletion();
				}
			}
		}
	}
}
$injector.registerCommand("autocomplete|*default", AutoCompleteCommand);

export class DisableAutoCompleteCommand implements ICommand {
	constructor(private $autoCompletionService: IAutoCompletionService,
		private $logger: ILogger) {
	}

	public disableAnalytics = true;
	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		if (this.$autoCompletionService.isAutoCompletionEnabled()) {
			this.$autoCompletionService.disableAutoCompletion();
		} else {
			this.$logger.info("Autocompletion is already disabled.");
		}
	}
}
$injector.registerCommand("autocomplete|disable", DisableAutoCompleteCommand);

export class EnableAutoCompleteCommand implements ICommand {
	constructor(private $autoCompletionService: IAutoCompletionService,
		private $logger: ILogger) { }

	public disableAnalytics = true;
	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		if (this.$autoCompletionService.isAutoCompletionEnabled()) {
			this.$logger.info("Autocompletion is already enabled.");
		} else {
			await this.$autoCompletionService.enableAutoCompletion();
		}
	}
}
$injector.registerCommand("autocomplete|enable", EnableAutoCompleteCommand);

export class AutoCompleteStatusCommand implements ICommand {
	constructor(private $autoCompletionService: IAutoCompletionService,
		private $logger: ILogger) { }

	public disableAnalytics = true;
	public allowedParameters: ICommandParameter[] = [];

	public async execute(args: string[]): Promise<void> {
		if (this.$autoCompletionService.isAutoCompletionEnabled()) {
			this.$logger.info("Autocompletion is enabled.");
		} else {
			this.$logger.info("Autocompletion is disabled.");
		}
	}
}
$injector.registerCommand("autocomplete|status", AutoCompleteStatusCommand);
