const jaroWinklerDistance = require("../vendor/jaro-winkler_distance");
import * as helpers from "../helpers";
import { CommandsDelimiters } from "../constants";
import { EOL } from "os";

class CommandArgumentsValidationHelper {
	constructor(public isValid: boolean, _remainingArguments: string[]) {
		this.remainingArguments = _remainingArguments.slice();
	}

	public remainingArguments: string[];
}

export class CommandsService implements ICommandsService {
	public get currentCommandData(): ICommandData {
		return _.last(this.commands);
	}

	private areDynamicSubcommandsRegistered = false;
	private commands: ICommandData[] = [];

	constructor(private $analyticsSettingsService: IAnalyticsSettingsService,
		private $commandsServiceProvider: ICommandsServiceProvider,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $hooksService: IHooksService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $options: ICommonOptions,
		private $resources: IResourceLoader,
		private $staticConfig: Config.IStaticConfig,
		private $helpService: IHelpService,
		private $extensibilityService: IExtensibilityService) {
	}

	public allCommands(opts: { includeDevCommands: boolean }): string[] {
		const commands = this.$injector.getRegisteredCommandsNames(opts.includeDevCommands);
		return _.reject(commands, (command) => _.includes(command, '|'));
	}

	public async executeCommandUnchecked(commandName: string, commandArguments: string[]): Promise<boolean> {
		this.commands.push({ commandName, commandArguments });
		const command = this.$injector.resolveCommand(commandName);
		if (command) {
			if (!this.$staticConfig.disableAnalytics && !command.disableAnalytics) {
				const analyticsService = this.$injector.resolve<IAnalyticsService>("analyticsService"); // This should be resolved here due to cyclic dependency
				await analyticsService.checkConsent();
				await analyticsService.trackFeature(commandName);

				const beautifiedCommandName = this.beautifyCommandName(commandName).replace(/\|/g, " ");

				const googleAnalyticsPageData: IGoogleAnalyticsPageviewData = {
					googleAnalyticsDataType: GoogleAnalyticsDataType.Page,
					path: beautifiedCommandName,
					title: beautifiedCommandName
				};

				const playgrounInfo = await this.$analyticsSettingsService.getPlaygroundInfo(null);
				if (playgrounInfo && playgrounInfo.id) {
					googleAnalyticsPageData.customDimensions = {
						[GoogleAnalyticsCustomDimensions.playgroundId]: playgrounInfo.id,
						[GoogleAnalyticsCustomDimensions.usedTutorial]: playgrounInfo.usedTutorial.toString()
					};
				}

				await analyticsService.trackInGoogleAnalytics(googleAnalyticsPageData);
			}

			const shouldExecuteHooks = !this.$staticConfig.disableCommandHooks && (command.enableHooks === undefined || command.enableHooks === true);
			if (shouldExecuteHooks) {
				// Handle correctly hierarchical commands
				const hierarchicalCommandName = this.$injector.buildHierarchicalCommand(commandName, commandArguments);
				if (hierarchicalCommandName) {
					commandName = helpers.stringReplaceAll(hierarchicalCommandName.commandName, CommandsDelimiters.DefaultHierarchicalCommand, CommandsDelimiters.HooksCommand);
					commandName = helpers.stringReplaceAll(commandName, CommandsDelimiters.HierarchicalCommand, CommandsDelimiters.HooksCommand);
				}

				await this.$hooksService.executeBeforeHooks(commandName);
			}

			await command.execute(commandArguments);
			if (command.postCommandAction) {
				await command.postCommandAction(commandArguments);
			}

			if (shouldExecuteHooks) {
				await this.$hooksService.executeAfterHooks(commandName);
			}

			const commandHelp = this.getCommandHelp();
			if (!command.disableCommandHelpSuggestion && commandHelp && commandHelp[commandName]) {
				const suggestionText: string = commandHelp[commandName];
				this.$logger.printMarkdown(~suggestionText.indexOf('%s') ? require('util').format(suggestionText, commandArguments) : suggestionText);
			}

			this.commands.pop();
			return true;
		}

		this.commands.pop();
		return false;
	}

	private printHelp(commandName: string, commandArguments: string[]): Promise<void> {
		return this.$helpService.showCommandLineHelp({ commandName: this.beautifyCommandName(commandName), commandArguments });
	}

	private async executeCommandAction(commandName: string, commandArguments: string[], action: (_commandName: string, _commandArguments: string[]) => Promise<boolean | ICanExecuteCommandOutput>): Promise<boolean> {
		return this.$errors.beginCommand(
			() => action.apply(this, [commandName, commandArguments]),
			() => this.printHelp(commandName, commandArguments));
	}

	private async tryExecuteCommandAction(commandName: string, commandArguments: string[]): Promise<boolean | ICanExecuteCommandOutput> {
		const command = this.$injector.resolveCommand(commandName);
		if (!command || (command && !command.isHierarchicalCommand)) {
			this.$options.validateOptions(command ? command.dashedOptions : null);
		}

		if (!this.areDynamicSubcommandsRegistered) {
			this.$commandsServiceProvider.registerDynamicSubCommands();
			this.areDynamicSubcommandsRegistered = true;
		}
		return this.canExecuteCommand(commandName, commandArguments);
	}

	public async tryExecuteCommand(commandName: string, commandArguments: string[]): Promise<void> {
		const canExecuteResult: any = await this.executeCommandAction(commandName, commandArguments, this.tryExecuteCommandAction);
		const canExecute = typeof canExecuteResult === "object" ? canExecuteResult.canExecute : canExecuteResult;
		const suppressCommandHelp = typeof canExecuteResult === "object" ? canExecuteResult.suppressCommandHelp : false;

		if (canExecute) {
			await this.executeCommandAction(commandName, commandArguments, this.executeCommandUnchecked);
		} else {
			// If canExecuteCommand returns false, the command cannot be executed or there's no such command at all.
			const command = this.$injector.resolveCommand(commandName);
			if (command) {
				if (!suppressCommandHelp) {
					// If command cannot be executed we should print its help.
					await this.printHelp(commandName, commandArguments);
				}
			}
		}
	}

	private async canExecuteCommand(commandName: string, commandArguments: string[], isDynamicCommand?: boolean): Promise<boolean | ICanExecuteCommandOutput> {
		const command = this.$injector.resolveCommand(commandName);
		const beautifiedName = helpers.stringReplaceAll(commandName, "|", " ");
		if (command) {
			// Verify command is enabled
			if (command.isDisabled) {
				this.$errors.failWithoutHelp("This command is not applicable to your environment.");
			}

			// If command wants to handle canExecute logic on its own.
			if (command.canExecute) {
				return await command.canExecute(commandArguments);
			}

			// First part of hierarchical commands should be validated in specific way.
			if (await this.$injector.isValidHierarchicalCommand(commandName, commandArguments)) {
				return true;
			}

			if (await this.validateCommandArguments(command, commandArguments)) {
				return true;
			}

			this.$errors.fail("Unable to execute command '%s'. Use '$ %s %s --help' for help.", beautifiedName, this.$staticConfig.CLIENT_NAME.toLowerCase(), beautifiedName);
			return false;
		} else if (!isDynamicCommand && _.startsWith(commandName, this.$commandsServiceProvider.dynamicCommandsPrefix)) {
			if (_.some(await this.$commandsServiceProvider.getDynamicCommands())) {
				await this.$commandsServiceProvider.generateDynamicCommands();
				return await this.canExecuteCommand(commandName, commandArguments, true);
			}
		}

		const commandInfo = {
			inputStrings: [commandName, ...commandArguments],
			commandDelimiter: CommandsDelimiters.HierarchicalCommand,
			defaultCommandDelimiter: CommandsDelimiters.DefaultHierarchicalCommand
		};

		const extensionData = await this.$extensibilityService.getExtensionNameWhereCommandIsRegistered(commandInfo);

		if (extensionData) {
			this.$logger.warn(extensionData.installationMessage);
		} else {
			this.$logger.fatal("Unknown command '%s'. Use '%s help' for help.", beautifiedName, this.$staticConfig.CLIENT_NAME.toLowerCase());
			this.tryMatchCommand(commandName);
		}

		return false;
	}

	private async validateMandatoryParams(commandArguments: string[], mandatoryParams: ICommandParameter[]): Promise<CommandArgumentsValidationHelper> {
		const commandArgsHelper = new CommandArgumentsValidationHelper(true, commandArguments);

		if (mandatoryParams.length > 0) {
			// If command has more mandatory params than the passed ones, we shouldn't execute it
			if (mandatoryParams.length > commandArguments.length) {
				const customErrorMessages = _.map(mandatoryParams, mp => mp.errorMessage);
				customErrorMessages.splice(0, 0, "You need to provide all the required parameters.");
				this.$errors.fail(customErrorMessages.join(EOL));
			}

			// If we reach here, the commandArguments are at least as much as mandatoryParams. Now we should verify that we have each of them.
			for (let mandatoryParamIndex = 0; mandatoryParamIndex < mandatoryParams.length; ++mandatoryParamIndex) {
				const mandatoryParam = mandatoryParams[mandatoryParamIndex];
				let argument: string = null;
				for (let remainingArgsIndex = 0; remainingArgsIndex < commandArgsHelper.remainingArguments.length; ++remainingArgsIndex) {
					const c = commandArgsHelper.remainingArguments[remainingArgsIndex];
					if (await mandatoryParam.validate(c)) {
						argument = c;
						break;
					}
				}

				if (argument) {
					helpers.remove(commandArgsHelper.remainingArguments, arg => arg === argument);
				} else {
					this.$errors.fail("Missing mandatory parameter.");
				}
			}
		}

		return commandArgsHelper;
	}

	private async validateCommandArguments(command: ICommand, commandArguments: string[]): Promise<boolean> {
		const mandatoryParams: ICommandParameter[] = _.filter(command.allowedParameters, (param) => param.mandatory);
		const commandArgsHelper = await this.validateMandatoryParams(commandArguments, mandatoryParams);
		if (!commandArgsHelper.isValid) {
			return false;
		}

		// Command doesn't have any allowedParameters
		if (!command.allowedParameters || command.allowedParameters.length === 0) {
			if (commandArguments.length > 0) {
				this.$errors.fail("This command doesn't accept parameters.");
			}
		} else {
			// Exclude mandatory params, we've already checked them
			const unverifiedAllowedParams = command.allowedParameters.filter((param) => !param.mandatory);

			for (let remainingArgsIndex = 0; remainingArgsIndex < commandArgsHelper.remainingArguments.length; ++remainingArgsIndex) {
				const argument = commandArgsHelper.remainingArguments[remainingArgsIndex];
				let parameter: ICommandParameter = null;
				for (let unverifiedIndex = 0; unverifiedIndex < unverifiedAllowedParams.length; ++unverifiedIndex) {
					const c = unverifiedAllowedParams[unverifiedIndex];
					if (await c.validate(argument)) {
						parameter = c;
						break;
					}
				}

				if (parameter) {
					const index = unverifiedAllowedParams.indexOf(parameter);
					// Remove the matched parameter from unverifiedAllowedParams collection, so it will not be used to verify another argument.
					unverifiedAllowedParams.splice(index, 1);
				} else {
					this.$errors.fail(`The parameter ${argument} is not valid for this command.`);
				}
			}
		}

		return true;
	}

	private tryMatchCommand(commandName: string): void {
		const allCommands = this.allCommands({ includeDevCommands: false });
		let similarCommands: ISimilarCommand[] = [];
		_.each(allCommands, (command) => {
			if (!this.$injector.isDefaultCommand(command)) {
				command = helpers.stringReplaceAll(command, "|", " ");
				const distance = jaroWinklerDistance(commandName, command);
				if (commandName.length > 3 && command.indexOf(commandName) !== -1) {
					similarCommands.push({ rating: 1, name: command });
				} else if (distance >= 0.65) {
					similarCommands.push({ rating: distance, name: command });
				}
			}
		});

		similarCommands = _.sortBy(similarCommands, (command) => {
			return -command.rating;
		}).slice(0, 5);

		if (similarCommands.length > 0) {
			const message = ["Did you mean?"];
			_.each(similarCommands, (command) => {
				message.push("\t" + command.name);
			});
			this.$logger.fatal(message.join("\n"));
		}
	}

	public async completeCommand(): Promise<boolean> {
		const tabtab = require("tabtab");

		const completeCallback = (err: Error, data: any) => {
			if (err || !data) {
				return;
			}

			const commands = this.$injector.getRegisteredCommandsNames(false);
			const splittedLine = data.line.split(/[ ]+/);
			const line = _.filter(splittedLine, (w) => w !== "");
			let commandName = <string>(line[line.length - 2]);

			const childrenCommands = this.$injector.getChildrenCommandsNames(commandName);

			if (data.last && _.startsWith(data.last, "--")) {
				return tabtab.log(_.keys(this.$options.options), data, "--");
			}

			if (data.last && _.startsWith(data.last, "-")) {
				return tabtab.log(this.$options.shorthands, data, "-");
			}

			if (data.words === 1) {
				const allCommands = this.allCommands({ includeDevCommands: false });
				return tabtab.log(allCommands, data);
			}

			if (data.words >= 2) { // Hierarchical command
				if (data.words !== line.length) {
					commandName = `${line[data.words - 2]}|${line[data.words - 1]}`;
				} else {
					commandName = `${line[line.length - 1]}`;
				}
			}

			const command = this.$injector.resolveCommand(commandName);
			if (command) {
				const completionData = command.completionData;
				if (completionData) {
					return tabtab.log(completionData, data);
				} else {
					return this.logChildrenCommandsNames(commandName, commands, tabtab, data);
				}
			} else if (childrenCommands) {
				let nonDefaultSubCommands = _.reject(childrenCommands, (children: string) => children[0] === '*');
				let sanitizedChildrenCommands: string[] = [];

				if (data.words !== line.length) {
					sanitizedChildrenCommands = nonDefaultSubCommands.map((commandToMap: string) => {
						const pipePosition = commandToMap.indexOf("|");
						return commandToMap.substring(0, pipePosition !== -1 ? pipePosition : commandToMap.length);
					});
				} else {
					nonDefaultSubCommands = nonDefaultSubCommands.filter((commandNameToFilter: string) => commandNameToFilter.indexOf("|") !== -1);
					sanitizedChildrenCommands = nonDefaultSubCommands.map((commandToMap: string) => {
						const pipePosition = commandToMap.lastIndexOf("|");
						return commandToMap.substring(pipePosition !== -1 ? pipePosition + 1 : 0, commandToMap.length);
					});
				}

				return tabtab.log(sanitizedChildrenCommands, data);
			} else {
				return this.logChildrenCommandsNames(commandName, commands, tabtab, data);
			}
		};

		await tabtab.complete(this.$staticConfig.CLIENT_NAME.toLowerCase(), completeCallback);

		if (this.$staticConfig.CLIENT_NAME_ALIAS) {
			tabtab.complete(this.$staticConfig.CLIENT_NAME_ALIAS.toLowerCase(), completeCallback);
		}

		return true;
	}

	private getCommandHelp(): any {
		let commandHelp: any = null;
		if (this.$fs.exists(this.$resources.resolvePath(this.$staticConfig.COMMAND_HELP_FILE_NAME))) {
			commandHelp = this.$resources.readJson(this.$staticConfig.COMMAND_HELP_FILE_NAME);
		}

		return commandHelp;
	}

	private beautifyCommandName(commandName: string): string {
		if (commandName.indexOf("*") > 0) {
			return commandName.substr(0, commandName.indexOf("|"));
		}

		return commandName;
	}

	private logChildrenCommandsNames(commandName: string, commands: string[], tabtab: any, data: any) {
		const matchingCommands = commands.filter((commandToFilter: string) => {
			return commandToFilter.indexOf(commandName + "|") !== -1 && commandToFilter !== commandName;
		})
			.map((commandToMap: string) => {

				const commandResult = commandToMap.replace(commandName + "|", "");

				return commandResult.substring(0, commandResult.indexOf("|") !== -1 ? commandResult.indexOf("|") : commandResult.length);
			});

		return tabtab.log(matchingCommands, data);
	}
}
$injector.register("commandsService", CommandsService);
