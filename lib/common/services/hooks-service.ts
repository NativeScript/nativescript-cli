import * as path from "path";
import * as util from "util";
import * as _ from "lodash";
import { annotate, getValueFromNestedObject } from "../helpers";
import { AnalyticsEventLabelDelimiter } from "../../constants";
import { IOptions, IPerformanceService } from "../../declarations";
import {
	IHook,
	IHooksService,
	IDictionary,
	IChildProcess,
	IFileSystem,
	IErrors,
	IProjectHelper,
	IStringDictionary,
} from "../declarations";
import {
	INsConfigHooks,
	IProjectConfigService,
} from "../../definitions/project";
import { IInjector } from "../definitions/yok";
import { injector } from "../yok";

class Hook implements IHook {
	constructor(public name: string, public fullPath: string) {}
}

export class HooksService implements IHooksService {
	private static HOOKS_DIRECTORY_NAME = "hooks";

	private cachedHooks: IDictionary<IHook[]>;

	private hooksDirectories: string[];

	constructor(
		private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $errors: IErrors,
		private $config: Config.IConfig,
		private $staticConfig: Config.IStaticConfig,
		private $injector: IInjector,
		private $projectHelper: IProjectHelper,
		private $options: IOptions,
		private $performanceService: IPerformanceService,
		private $projectConfigService: IProjectConfigService
	) {}

	public get hookArgsName(): string {
		return "hookArgs";
	}

	private initialize(projectDir: string): void {
		this.cachedHooks = {};

		this.hooksDirectories = [];

		projectDir = projectDir || this.$projectHelper.projectDir;

		if (projectDir) {
			this.hooksDirectories.push(
				path.join(projectDir, HooksService.HOOKS_DIRECTORY_NAME)
			);
		}

		this.$logger.trace(
			"Hooks directories: " + util.inspect(this.hooksDirectories)
		);

		const customHooks = this.$projectConfigService.getValue("hooks", []);

		if (customHooks.length) {
			this.$logger.trace("Custom hooks: " + util.inspect(customHooks));
		}
	}

	private static formatHookName(commandName: string): string {
		// Remove everything after | (including the pipe)
		return commandName.replace(/\|[\s\S]*$/, "");
	}

	public executeBeforeHooks(
		commandName: string,
		hookArguments?: IDictionary<any>
	): Promise<void> {
		const beforeHookName = `before-${HooksService.formatHookName(commandName)}`;
		const traceMessage = `BeforeHookName for command ${commandName} is ${beforeHookName}`;
		return this.executeHooks(beforeHookName, traceMessage, hookArguments);
	}

	public executeAfterHooks(
		commandName: string,
		hookArguments?: IDictionary<any>
	): Promise<void> {
		const afterHookName = `after-${HooksService.formatHookName(commandName)}`;
		const traceMessage = `AfterHookName for command ${commandName} is ${afterHookName}`;
		return this.executeHooks(afterHookName, traceMessage, hookArguments);
	}

	private async executeHooks(
		hookName: string,
		traceMessage: string,
		hookArguments?: IDictionary<any>
	): Promise<any> {
		if (this.$config.DISABLE_HOOKS || !this.$options.hooks) {
			return;
		}

		const hookArgs: any = hookArguments && hookArguments[this.hookArgsName];
		let projectDir = hookArgs && hookArgs.projectDir;
		if (!projectDir && hookArgs) {
			const candidate = getValueFromNestedObject(hookArgs, "projectDir");
			projectDir = candidate && candidate.projectDir;
		}

		this.$logger.trace(`Project dir from hooksArgs is: ${projectDir}.`);

		this.initialize(projectDir);

		this.$logger.trace(traceMessage);
		const results: any[] = [];
		try {
			for (const hooksDirectory of this.hooksDirectories) {
				results.push(
					await this.executeHooksInDirectory(
						hooksDirectory,
						hookName,
						hookArguments
					)
				);
			}

			const customHooks = this.getCustomHooksByName(hookName);

			for (const hook of customHooks) {
				results.push(
					await this.executeHook(
						this.$projectHelper.projectDir,
						hookName,
						hook,
						hookArguments
					)
				);
			}
		} catch (err) {
			this.$logger.trace(`Failed during hook execution ${hookName}.`);
			this.$errors.fail(err.message || err);
		}

		return _.flatten(results);
	}

	private async executeHook(
		directoryPath: string,
		hookName: string,
		hook: IHook,
		hookArguments?: IDictionary<any>
	): Promise<any> {
		hookArguments = hookArguments || {};

		let result;

		const relativePath = path.relative(directoryPath, hook.fullPath);
		const trackId = relativePath.replace(
			new RegExp("\\" + path.sep, "g"),
			AnalyticsEventLabelDelimiter
		);
		let command = this.getSheBangInterpreter(hook);
		let inProc = false;
		if (!command) {
			command = hook.fullPath;
			if (path.extname(hook.fullPath).toLowerCase() === ".js") {
				command = process.argv[0];
				inProc = this.shouldExecuteInProcess(this.$fs.readText(hook.fullPath));
			}
		}

		const startTime = this.$performanceService.now();
		if (inProc) {
			this.$logger.trace(
				"Executing %s hook at location %s in-process",
				hookName,
				hook.fullPath
			);
			const hookEntryPoint = require(hook.fullPath);

			this.$logger.trace(`Validating ${hookName} arguments.`);

			const invalidArguments = this.validateHookArguments(
				hookEntryPoint,
				hook.fullPath
			);

			if (invalidArguments.length) {
				this.$logger.warn(
					`${
						hook.fullPath
					} will NOT be executed because it has invalid arguments - ${
						invalidArguments.join(", ").grey
					}.`
				);
				return;
			}

			// HACK for backwards compatibility:
			// In case $projectData wasn't resolved by the time we got here (most likely we got here without running a command but through a service directly)
			// then it is probably passed as a hookArg
			// if that is the case then pass it directly to the hook instead of trying to resolve $projectData via injector
			// This helps make hooks stateless
			const projectDataHookArg =
				hookArguments["hookArgs"] && hookArguments["hookArgs"]["projectData"];
			if (projectDataHookArg) {
				hookArguments["projectData"] = hookArguments[
					"$projectData"
				] = projectDataHookArg;
			}

			const maybePromise = this.$injector.resolve(
				hookEntryPoint,
				hookArguments
			);
			if (maybePromise) {
				this.$logger.trace("Hook promises to signal completion");
				try {
					result = await maybePromise;
				} catch (err) {
					if (
						err &&
						_.isBoolean(err.stopExecution) &&
						err.errorAsWarning === true
					) {
						this.$logger.warn(err.message || err);
					} else {
						// Print the actual error with its callstack, so it is easy to find out which hooks is causing troubles.
						this.$logger.error(err);
						throw err || new Error(`Failed to execute hook: ${hook.fullPath}.`);
					}
				}

				this.$logger.trace("Hook completed");
			}
		} else {
			const environment = this.prepareEnvironment(hook.fullPath);
			this.$logger.trace(
				"Executing %s hook at location %s with environment ",
				hookName,
				hook.fullPath,
				environment
			);

			const output = await this.$childProcess.spawnFromEvent(
				command,
				[hook.fullPath],
				"close",
				environment,
				{ throwError: false }
			);
			result = output;

			if (output.exitCode !== 0) {
				throw new Error(output.stdout + output.stderr);
			}

			this.$logger.trace(
				"Finished executing %s hook at location %s with environment ",
				hookName,
				hook.fullPath,
				environment
			);
		}
		const endTime = this.$performanceService.now();
		this.$performanceService.processExecutionData(trackId, startTime, endTime, [
			hookArguments,
		]);

		return result;
	}

	private async executeHooksInDirectory(
		directoryPath: string,
		hookName: string,
		hookArguments?: IDictionary<any>
	): Promise<any[]> {
		hookArguments = hookArguments || {};
		const results: any[] = [];
		const hooks = this.getHooksByName(directoryPath, hookName);

		for (let i = 0; i < hooks.length; ++i) {
			const hook = hooks[i];
			const result = await this.executeHook(
				directoryPath,
				hookName,
				hook,
				hookArguments
			);

			if (result) {
				results.push(result);
			}
		}

		return results;
	}

	private getCustomHooksByName(hookName: string): IHook[] {
		const hooks: IHook[] = [];
		const customHooks: INsConfigHooks[] =
			this.$projectConfigService.getValue("hooks", []);

		for (const cHook of customHooks) {
			if (cHook.type === hookName) {
				const fullPath = path.join(
					this.$projectHelper.projectDir,
					cHook.script
				);
				const isFile = this.$fs.getFsStats(fullPath).isFile();

				if (isFile) {
					const fileNameParts = cHook.script.split("/");
					hooks.push(
						new Hook(
							this.getBaseFilename(fileNameParts[fileNameParts.length - 1]),
							fullPath
						)
					);
				}
			}
		}

		return hooks;
	}

	private getHooksByName(directoryPath: string, hookName: string): IHook[] {
		const allBaseHooks = this.getHooksInDirectory(directoryPath);
		const baseHooks = _.filter(
			allBaseHooks,
			(hook) => hook.name.toLowerCase() === hookName.toLowerCase()
		);
		const moreHooks = this.getHooksInDirectory(
			path.join(directoryPath, hookName)
		);
		return baseHooks.concat(moreHooks);
	}

	private getHooksInDirectory(directoryPath: string): IHook[] {
		if (!this.cachedHooks[directoryPath]) {
			let hooks: IHook[] = [];
			if (
				directoryPath &&
				this.$fs.exists(directoryPath) &&
				this.$fs.getFsStats(directoryPath).isDirectory()
			) {
				const directoryContent = this.$fs.readDirectory(directoryPath);
				const files = _.filter(directoryContent, (entry: string) => {
					const fullPath = path.join(directoryPath, entry);
					const isFile = this.$fs.getFsStats(fullPath).isFile();
					return isFile;
				});

				hooks = _.map(files, (file) => {
					const fullPath = path.join(directoryPath, file);
					return new Hook(this.getBaseFilename(file), fullPath);
				});
			}

			this.cachedHooks[directoryPath] = hooks;
		}

		return this.cachedHooks[directoryPath];
	}

	private prepareEnvironment(hookFullPath: string): any {
		const clientName = this.$staticConfig.CLIENT_NAME.toUpperCase();

		const environment: IStringDictionary = {};
		environment[util.format("%s-COMMANDLINE", clientName)] = process.argv.join(
			" "
		);
		environment[util.format("%s-HOOK_FULL_PATH", clientName)] = hookFullPath;
		environment[
			util.format("%s-VERSION", clientName)
		] = this.$staticConfig.version;

		return {
			cwd: this.$projectHelper.projectDir,
			stdio: "inherit",
			env: _.extend({}, process.env, environment),
		};
	}

	private getSheBangInterpreter(hook: IHook): string {
		let interpreter: string = null;
		let shMatch: string[] = [];
		const fileContent = this.$fs.readText(hook.fullPath);
		if (fileContent) {
			const sheBangMatch = fileContent
				.split("\n")[0]
				.match(/^#!(?:\/usr\/bin\/env )?([^\r\n]+)/m);
			if (sheBangMatch) {
				interpreter = sheBangMatch[1];
			}
			if (interpreter) {
				// Likewise, make /usr/bin/bash work like "bash".
				shMatch = interpreter.match(/bin\/((?:ba)?sh)$/);
			}
			if (shMatch) {
				interpreter = shMatch[1];
			}
		}

		return interpreter;
	}

	private getBaseFilename(fileName: string): string {
		return fileName.substr(0, fileName.length - path.extname(fileName).length);
	}

	private shouldExecuteInProcess(scriptSource: string): boolean {
		try {
			const esprima = require("esprima");
			const ast = esprima.parse(scriptSource);

			let inproc = false;
			ast.body.forEach((statement: any) => {
				if (
					statement.type !== "ExpressionStatement" ||
					statement.expression.type !== "AssignmentExpression"
				) {
					return;
				}

				const left = statement.expression.left;
				if (
					left.type === "MemberExpression" &&
					left.object &&
					left.object.type === "Identifier" &&
					left.object.name === "module" &&
					left.property &&
					left.property.type === "Identifier" &&
					left.property.name === "exports"
				) {
					inproc = true;
				}
			});

			return inproc;
		} catch (err) {
			return false;
		}
	}

	private validateHookArguments(
		hookConstructor: any,
		hookFullPath: string
	): string[] {
		const invalidArguments: string[] = [];

		// We need to annotate the hook in order to have the arguments of the constructor.
		annotate(hookConstructor);

		_.each(hookConstructor.$inject.args, (argument: string) => {
			try {
				if (argument !== this.hookArgsName) {
					this.$injector.resolve(argument);
				}
			} catch (err) {
				this.$logger.trace(
					`Cannot resolve ${argument} of hook ${hookFullPath}, reason: ${err}`
				);
				invalidArguments.push(argument);
			}
		});

		return invalidArguments;
	}
}
injector.register("hooksService", HooksService);
