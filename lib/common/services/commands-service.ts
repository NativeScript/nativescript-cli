const jaroWinklerDistance = require("../vendor/jaro-winkler_distance");
import * as helpers from "../helpers";
import { CommandsDelimiters } from "../constants";
import { EOL } from "os";
import * as _ from "lodash";
import { IOptions, IOptionsTracker } from "../../declarations";
import {
	IErrors,
	IHooksService,
	IAnalyticsService,
	GoogleAnalyticsDataType,
} from "../declarations";
import { IInjector } from "../definitions/yok";
import { injector } from "../yok";
import { IExtensibilityService } from "../definitions/extensibility";
import { IGoogleAnalyticsPageviewData } from "../definitions/google-analytics";
import {
	ICommandParameter,
	ICommand,
	ISimilarCommand,
} from "../definitions/commands";

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

	private commands: ICommandData[] = [];

	constructor(
		private $errors: IErrors,
		private $hooksService: IHooksService,
		private $injector: IInjector,
		private $logger: ILogger,
		private $options: IOptions,
		private $staticConfig: Config.IStaticConfig,
		private $extensibilityService: IExtensibilityService,
		private $optionsTracker: IOptionsTracker
	) {}

	public allCommands(opts: { includeDevCommands: boolean }): string[] {
		const commands = this.$injector.getRegisteredCommandsNames(
			opts.includeDevCommands
		);
		return _.reject(commands, (command) => _.includes(command, "|"));
	}

	public async executeCommandUnchecked(
		commandName: string,
		commandArguments: string[]
	): Promise<boolean> {
		this.commands.push({ commandName, commandArguments });
		const command = this.$injector.resolveCommand(commandName);
		if (command) {
			if (!this.$staticConfig.disableAnalytics && !command.disableAnalytics) {
				const analyticsService =
					this.$injector.resolve<IAnalyticsService>("analyticsService"); // This should be resolved here due to cyclic dependency
				await analyticsService.checkConsent();

				const beautifiedCommandName = this.beautifyCommandName(
					commandName
				).replace(/\|/g, " ");

				const googleAnalyticsPageData: IGoogleAnalyticsPageviewData = {
					googleAnalyticsDataType: GoogleAnalyticsDataType.Page,
					path: beautifiedCommandName,
					title: beautifiedCommandName,
				};

				await analyticsService.trackInGoogleAnalytics(googleAnalyticsPageData);
				await this.$optionsTracker.trackOptions(this.$options);
			}

			const shouldExecuteHooks =
				!this.$staticConfig.disableCommandHooks &&
				(command.enableHooks === undefined || command.enableHooks === true);
			if (shouldExecuteHooks) {
				// Handle correctly hierarchical commands
				const hierarchicalCommandName = this.$injector.buildHierarchicalCommand(
					commandName,
					commandArguments
				);
				if (hierarchicalCommandName) {
					commandName = helpers.stringReplaceAll(
						hierarchicalCommandName.commandName,
						CommandsDelimiters.DefaultHierarchicalCommand,
						CommandsDelimiters.HooksCommand
					);
					commandName = helpers.stringReplaceAll(
						commandName,
						CommandsDelimiters.HierarchicalCommand,
						CommandsDelimiters.HooksCommand
					);
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

			this.commands.pop();
			return true;
		}

		this.commands.pop();
		return false;
	}

	private printHelpSuggestion(commandName?: string): Promise<void> {
		const command = commandName
			? helpers.stringReplaceAll(
					this.beautifyCommandName(commandName),
					"|",
					" "
			  ) + " "
			: "";
		const commandHelp = `ns ${command}--help`;
		this.$logger.printMarkdown(
			`__Run \`${commandHelp}\` for more information.__`
		);
		return;
	}

	private async executeCommandAction(
		commandName: string,
		commandArguments: string[],
		action: (
			_commandName: string,
			_commandArguments: string[]
		) => Promise<boolean>
	): Promise<boolean> {
		return this.$errors.beginCommand(
			() => action.apply(this, [commandName, commandArguments]),
			() => this.printHelpSuggestion(commandName)
		);
	}

	private async tryExecuteCommandAction(
		commandName: string,
		commandArguments: string[]
	): Promise<boolean> {
		const command = this.$injector.resolveCommand(commandName);
		if (!command || !command.isHierarchicalCommand) {
			const dashedOptions = command ? command.dashedOptions : null;
			this.$options.validateOptions(dashedOptions);
		}

		return this.canExecuteCommand(commandName, commandArguments);
	}

	public async tryExecuteCommand(
		commandName: string,
		commandArguments: string[]
	): Promise<void> {
		const canExecuteResult: any = await this.executeCommandAction(
			commandName,
			commandArguments,
			this.tryExecuteCommandAction
		);
		const canExecute =
			typeof canExecuteResult === "object"
				? canExecuteResult.canExecute
				: canExecuteResult;

		if (canExecute) {
			await this.executeCommandAction(
				commandName,
				commandArguments,
				this.executeCommandUnchecked
			);
		} else {
			// If canExecuteCommand returns false, the command cannot be executed or there's no such command at all.
			const command = this.$injector.resolveCommand(commandName);
			if (command) {
				let commandWithArgs = commandName;
				if (commandArguments && commandArguments.length) {
					commandWithArgs += ` ${commandArguments.join(" ")}`;
				}
				this.$logger.error(`Command '${commandWithArgs}' cannot be executed.`);
				await this.printHelpSuggestion(commandName);
			}
		}
	}

	private async canExecuteCommand(
		commandName: string,
		commandArguments: string[],
		isDynamicCommand?: boolean
	): Promise<boolean> {
		const command = this.$injector.resolveCommand(commandName);
		const beautifiedName = helpers.stringReplaceAll(commandName, "|", " ");
		if (command) {
			// Verify command is enabled
			if (command.isDisabled) {
				this.$errors.fail(
					"This command is not applicable to your environment."
				);
			}

			// If command wants to handle canExecute logic on its own.
			if (command.canExecute) {
				return await command.canExecute(commandArguments);
			}

			// First part of hierarchical commands should be validated in specific way.
			if (
				await this.$injector.isValidHierarchicalCommand(
					commandName,
					commandArguments
				)
			) {
				return true;
			}

			if (await this.validateCommandArguments(command, commandArguments)) {
				return true;
			}

			this.$errors.fail(`Unable to execute command '${beautifiedName}'.`);
			return false;
		}

		const commandInfo = {
			inputStrings: [commandName, ...commandArguments],
			commandDelimiter: CommandsDelimiters.HierarchicalCommand,
			defaultCommandDelimiter: CommandsDelimiters.DefaultHierarchicalCommand,
		};

		const extensionData =
			await this.$extensibilityService.getExtensionNameWhereCommandIsRegistered(
				commandInfo
			);

		if (extensionData) {
			this.$logger.warn(extensionData.installationMessage);
		} else {
			this.$logger.error("Unknown command '%s'.", beautifiedName);
			await this.printHelpSuggestion();
			this.tryMatchCommand(commandName);
		}

		return false;
	}

	private async validateMandatoryParams(
		commandArguments: string[],
		mandatoryParams: ICommandParameter[]
	): Promise<CommandArgumentsValidationHelper> {
		const commandArgsHelper = new CommandArgumentsValidationHelper(
			true,
			commandArguments
		);

		if (mandatoryParams.length > 0) {
			// If command has more mandatory params than the passed ones, we shouldn't execute it
			if (mandatoryParams.length > commandArguments.length) {
				const customErrorMessages = _.map(
					mandatoryParams,
					(mp) => mp.errorMessage
				);
				customErrorMessages.splice(
					0,
					0,
					"You need to provide all the required parameters."
				);
				this.$errors.failWithHelp(customErrorMessages.join(EOL));
			}

			// If we reach here, the commandArguments are at least as much as mandatoryParams. Now we should verify that we have each of them.
			for (
				let mandatoryParamIndex = 0;
				mandatoryParamIndex < mandatoryParams.length;
				++mandatoryParamIndex
			) {
				const mandatoryParam = mandatoryParams[mandatoryParamIndex];
				let argument: string = null;
				for (
					let remainingArgsIndex = 0;
					remainingArgsIndex < commandArgsHelper.remainingArguments.length;
					++remainingArgsIndex
				) {
					const c = commandArgsHelper.remainingArguments[remainingArgsIndex];
					if (await mandatoryParam.validate(c)) {
						argument = c;
						break;
					}
				}

				if (argument) {
					helpers.remove(
						commandArgsHelper.remainingArguments,
						(arg) => arg === argument
					);
				} else {
					this.$errors.failWithHelp("Missing mandatory parameter.");
				}
			}
		}

		return commandArgsHelper;
	}

	private async validateCommandArguments(
		command: ICommand,
		commandArguments: string[]
	): Promise<boolean> {
		const mandatoryParams: ICommandParameter[] = _.filter(
			command.allowedParameters,
			(param) => param.mandatory
		);
		const commandArgsHelper = await this.validateMandatoryParams(
			commandArguments,
			mandatoryParams
		);
		if (!commandArgsHelper.isValid) {
			return false;
		}

		// Command doesn't have any allowedParameters
		if (!command.allowedParameters || command.allowedParameters.length === 0) {
			if (commandArguments.length > 0) {
				this.$errors.failWithHelp("This command doesn't accept parameters.");
			}
		} else {
			// Exclude mandatory params, we've already checked them
			const unverifiedAllowedParams = command.allowedParameters.filter(
				(param) => !param.mandatory
			);

			for (
				let remainingArgsIndex = 0;
				remainingArgsIndex < commandArgsHelper.remainingArguments.length;
				++remainingArgsIndex
			) {
				const argument =
					commandArgsHelper.remainingArguments[remainingArgsIndex];
				let parameter: ICommandParameter = null;
				for (
					let unverifiedIndex = 0;
					unverifiedIndex < unverifiedAllowedParams.length;
					++unverifiedIndex
				) {
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
					this.$errors.failWithHelp(
						`The parameter ${argument} is not valid for this command.`
					);
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

	private beautifyCommandName(commandName: string): string {
		if (commandName.indexOf("*") > 0) {
			return commandName.substring(0, commandName.indexOf("|"));
		}

		return commandName;
	}
}
injector.register("commandsService", CommandsService);
