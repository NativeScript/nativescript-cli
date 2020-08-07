import { Yok } from "../../yok";
import { Errors } from "../../errors";
import { CommonLoggerStub } from "./stubs";
import { assert } from "chai";
import * as path from "path";
import { LoggerLevel } from "../../../constants";
const helpers = require("../../helpers");
const originalIsInteractive = helpers.isInteractive;
const originalProcessExit = process.exit;

describe("errors", () => {
	let isInteractive = false;
	let processExitCode = 0;

	beforeAll(() => {
		helpers.isInteractive = () => isInteractive;
	});

	afterAll(() => {
		helpers.isInteractive = originalIsInteractive;
	});

	const getTestInjector = (): IInjector => {
		const testInjector = new Yok();
		testInjector.register("errors", Errors);
		testInjector.register("logger", CommonLoggerStub);
		return testInjector;
	};

	describe("beginCommand", () => {
		let testInjector: IInjector;
		let errors: IErrors;
		let logger: CommonLoggerStub;
		const errMsg = "Error Message";
		let isProcessExitCalled = false;
		let isPrintCommandHelpSuggestionExecuted = false;
		let actionResult = true;

		beforeEach(() => {
			(<any>process).exit = (code?: number): any => {
				isProcessExitCalled = true;
				processExitCode = code;
			};
			testInjector = getTestInjector();
			errors = testInjector.resolve("errors");
			logger = testInjector.resolve("logger");
			isProcessExitCalled = false;
			isPrintCommandHelpSuggestionExecuted = false;
			actionResult = true;
			isInteractive = false;
		});

		afterEach(() => {
			process.exit = originalProcessExit;
		});

		const setupTest = (opts?: { err?: Error }): { action: () => Promise<boolean>, printCommandHelpSuggestion: () => Promise<void> } => {
			const action = async () => {
				if (opts && opts.err) {
					throw opts.err;
				}

				return actionResult;
			};

			const printCommandHelpSuggestion = async () => {
				isPrintCommandHelpSuggestionExecuted = true;
			};

			return { action, printCommandHelpSuggestion };
		};

		const assertProcessExited = () => {
			assert.isTrue(isProcessExitCalled, "When the action fails, process.exit must be called.");
			assert.equal(processExitCode, 127, "When the action fails, process.exit must be called with 127 by default.");
		};

		const assertPrintCommandHelpSuggestionIsNotCalled = () => {
			assert.isFalse(isPrintCommandHelpSuggestionExecuted, "printCommandHelpSuggestion should not be called when the suggestCommandHelp is not set to the exception.");
		};

		it("executes the passed action and does not print anything when it is successful", async () => {
			const { action, printCommandHelpSuggestion } = setupTest();
			let result = await errors.beginCommand(action, printCommandHelpSuggestion);
			assert.isTrue(result, "beginCommand must return the result of the passed action.");

			actionResult = false;
			result = await errors.beginCommand(action, printCommandHelpSuggestion);
			assert.isFalse(result, "beginCommand must return the result of the passed action.");
			assert.equal(logger.errorOutput, "");
			assert.equal(logger.output, "");
			assert.equal(logger.traceOutput, "");
			assertPrintCommandHelpSuggestionIsNotCalled();
		});

		it("exits the process when the action fails", async () => {
			const { action, printCommandHelpSuggestion } = setupTest({ err: new Error(errMsg) });
			await errors.beginCommand(action, printCommandHelpSuggestion);
			assertProcessExited();
			assert.equal(logger.errorOutput, errMsg + '\n');
			assertPrintCommandHelpSuggestionIsNotCalled();
		});

		describe("prints the stack trace of the error when", () => {
			const assertCallStack = () => {
				assert.isTrue(logger.errorOutput.indexOf(errMsg) !== -1, "The error output must contain the error message");
				assert.isTrue(logger.errorOutput.indexOf("at Generator.next") !== -1, "The error output must contain callstack");
				assert.isTrue(logger.errorOutput.indexOf(path.join("lib", "common")) !== -1, "The error output must contain path to lib/common, as this is the location of the file");
			};

			it("printCallStack property is set to true", async () => {
				const { action, printCommandHelpSuggestion } = setupTest({ err: new Error(errMsg) });
				errors.printCallStack = true;
				await errors.beginCommand(action, printCommandHelpSuggestion);
				assertCallStack();
				assertProcessExited();
				assertPrintCommandHelpSuggestionIsNotCalled();
			});

			it("loggerLevel is TRACE", async () => {
				const { action, printCommandHelpSuggestion } = setupTest({ err: new Error(errMsg) });
				logger.loggerLevel = LoggerLevel.TRACE;
				await errors.beginCommand(action, printCommandHelpSuggestion);
				assertCallStack();
				assertProcessExited();
				assertPrintCommandHelpSuggestionIsNotCalled();
			});

			it("loggerLevel is DEBUG", async () => {
				const { action, printCommandHelpSuggestion } = setupTest({ err: new Error(errMsg) });
				logger.loggerLevel = LoggerLevel.DEBUG;
				await errors.beginCommand(action, printCommandHelpSuggestion);
				assertCallStack();
				assertProcessExited();
				assertPrintCommandHelpSuggestionIsNotCalled();
			});
		});

		it("colorizes the error message to stderr when the terminal is interactive", async () => {
			const { action, printCommandHelpSuggestion } = setupTest({ err: new Error(errMsg) });
			isInteractive = true;
			await errors.beginCommand(action, printCommandHelpSuggestion);
			assert.equal(logger.errorOutput, `\x1B[31;1m${errMsg}\x1B[0m\n`);
			assertProcessExited();
			assertPrintCommandHelpSuggestionIsNotCalled();
		});

		it("prints message on stdout instead of stderr when printOnStdout is set in the Error", async () => {
			const errObj: any = new Error(errMsg);
			errObj.printOnStdout = true;
			const { action, printCommandHelpSuggestion } = setupTest({ err: errObj });
			await errors.beginCommand(action, printCommandHelpSuggestion);
			assert.equal(logger.errorOutput, "");
			assert.equal(logger.output, `${errMsg}\n`);
			assertProcessExited();
			assertPrintCommandHelpSuggestionIsNotCalled();
		});

		it("suggests how to show command help when error's suggestCommandHelp is set", async () => {
			const errObj: any = new Error(errMsg);
			errObj.suggestCommandHelp = true;
			const { action, printCommandHelpSuggestion } = setupTest({ err: errObj });
			await errors.beginCommand(action, printCommandHelpSuggestion);
			assert.equal(logger.errorOutput, `${errMsg}\n`);
			assertProcessExited();
			assert.isTrue(isPrintCommandHelpSuggestionExecuted, "printCommandHelpSuggestion should be called when the action fails with an error object for which suggestCommandHelp is true.");
		});

		it("exits with passed exit code when the error has errorCode set to number", async () => {
			const errObj: any = new Error(errMsg);
			errObj.errorCode = 222;
			const { action, printCommandHelpSuggestion } = setupTest({ err: errObj });
			await errors.beginCommand(action, printCommandHelpSuggestion);
			assert.equal(logger.errorOutput, `${errMsg}\n`);
			assert.isTrue(isProcessExitCalled, "When the action fails, process.exit must be called.");
			assert.equal(processExitCode, errObj.errorCode, `When the action fails, process.exit must be called with ${errObj.errorCode}.`);
		});

		it("exits with default exit code code when the error has errorCode set to string", async () => {
			const errObj: any = new Error(errMsg);
			errObj.errorCode = "222";
			const { action, printCommandHelpSuggestion } = setupTest({ err: errObj });
			await errors.beginCommand(action, printCommandHelpSuggestion);
			assert.equal(logger.errorOutput, `${errMsg}\n`);
			assert.isTrue(isProcessExitCalled, "When the action fails, process.exit must be called.");
			assert.equal(processExitCode, 127, "When the action fails, process.exit must be called with 127 by default.");
		});
	});
});
