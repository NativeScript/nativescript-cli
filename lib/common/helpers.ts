import * as uuid from "uuid";
import * as net from "net";
import { platform, EOL } from "os";
import { ReadStream } from "tty";
import { Configurations } from "./constants";
import { EventEmitter } from "events";
import * as crypto from "crypto";

const Table = require("cli-table");

/**
 * Creates regular expression from input string.
 * The method replaces all occurences of RegExp special symbols in the input string with \<symbol>.
 * @param {string} input The string from which a regular expression should be created.
 * @param {string} opts RegExp options, for example "gm" - global and multiline.
 * @returns {RegExp} The regular expression created from the input string.
 */
export function createRegExp(input: string, opts?: string): RegExp {
	if (!input || !_.isString(input)) {
		throw new Error("Input must be a string.");
	}

	const escapedSource = regExpEscape(input);
	return new RegExp(escapedSource, opts);
}

/**
 * Escapes all special symbols used in regex.
 * @param {string} input The string in which to replace the special regexp symbols.
 * @returns {string} A string in which all regex symbols are escaped.
 */
export function regExpEscape(input: string): string {
	// https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
	return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function isRecommendedAarFile(foundAarFile: string, packageJsonPluginName: string): boolean {
	const filename = foundAarFile.replace(/^.*[\\\/]/, '');
	packageJsonPluginName = getShortPluginName(packageJsonPluginName);
	return `${packageJsonPluginName}.aar` === filename;
}

export function getShortPluginName(pluginName: string): string {
	return sanitizePluginName(pluginName).replace(/[\-]/g, "_");
}

function sanitizePluginName(pluginName: string): string {
	// avoid long plugin names, exclude the npm module scope (@scope/nativescript-plugin) from the android plugin name
	return pluginName.split("/").pop();
}

export async function executeActionByChunks<T>(initialData: T[] | IDictionary<T>, chunkSize: number, elementAction: (element: T, key?: string | number) => Promise<any>): Promise<void> {
	let arrayToChunk: (T | string)[];
	let action: (key: string | T) => Promise<any>;

	if (_.isArray(initialData)) {
		arrayToChunk = initialData;
		action = (element: T) => elementAction(element, initialData.indexOf(element));
	} else {
		arrayToChunk = _.keys(initialData);
		action = (key: string) => elementAction(initialData[key], key);
	}

	const chunks = _.chunk(arrayToChunk, chunkSize);
	for (const chunk of chunks) {
		await Promise.all(_.map(chunk, element => action(element)));
	}
}

export function deferPromise<T>(): IDeferPromise<T> {
	let resolve: (value?: T | PromiseLike<T>) => void;
	let reject: (reason?: any) => void;
	let isResolved = false;
	let isRejected = false;
	let promise: Promise<T>;

	promise = new Promise<T>((innerResolve, innerReject) => {
		resolve = (value?: T | PromiseLike<T>) => {
			isResolved = true;

			return innerResolve(value);
		};

		reject = (reason?: any) => {
			isRejected = true;

			return innerReject(reason);
		};
	});

	return {
		promise,
		resolve,
		reject,
		isResolved: () => isResolved,
		isRejected: () => isRejected,
		isPending: () => !isResolved && !isRejected
	};
}

/**
 * Executes all promises and does not stop in case any of them throws.
 * Returns the results of all promises in array when all are successfully resolved.
 * In case any of the promises is rejected, rejects the resulted promise with all accumulated errors.
 * @param {Promise<T>[]} promises Promises to be resolved.
 * @returns {Promise<T[]>} New promise which will be resolved with the results of all promises.
 */
export function settlePromises<T>(promises: Promise<T>[]): Promise<T[]> {
	return new Promise((resolve, reject) => {
		let settledPromisesCount = 0;
		const results: T[] = [];
		const errors: Error[] = [];

		const length = promises.length;

		if (!promises.length) {
			resolve();
		}

		_.forEach(promises, (currentPromise, index) => {
			currentPromise
				.then(result => {
					results[index] = result;
				})
				.catch(err => {
					// Accumulate all errors.
					errors.push(err);
				})
				.then(() => {
					settledPromisesCount++;

					if (settledPromisesCount === length) {
						errors.length ? reject(new Error(`Multiple errors were thrown:${EOL}${errors.map(e => e.message || e).join(EOL)}`)) : resolve(results);
					}
				})
				.catch();
		});
	});
}

export function getPropertyName(func: Function): string {
	if (func) {
		const match = func.toString().match(/(?:return\s+?.*\.(.+);)|(?:=>\s*?.*\.(.+)\b)/);
		if (match) {
			return (match[1] || match[2]).trim();
		}
	}

	return null;
}

function bashQuote(s: string): string {
	if (s[0] === "'" && s[s.length - 1] === "'") {
		return s;
	}
	// replace ' with '"'"' and wrap in ''
	return "'" + s.replace(/'/g, '\'"\'"\'') + "'";
}

function cmdQuote(s: string): string {
	if (s[0] === '"' && s[s.length - 1] === '"') {
		return s;
	}
	// replace " with \" and wrap in ""
	return '"' + s.replace(/"/g, '\\"') + '"';
}

export function quoteString(s: string): string {
	if (!s) {
		return s;
	}

	return (platform() === "win32") ? cmdQuote(s) : bashQuote(s);
}

export function createGUID(useBraces?: boolean) {
	let output: string;

	useBraces = useBraces === undefined ? true : useBraces;

	if (useBraces) {
		output = "{" + uuid.v4() + "}";
	} else {
		output = uuid.v4();
	}

	return output;
}

export function stringReplaceAll(inputString: string, find: any, replace: string): string {
	return inputString.split(find).join(replace);
}

export function isRequestSuccessful(request: Server.IRequestResponseData) {
	return request.statusCode >= 200 && request.statusCode < 300;
}

export function isResponseRedirect(response: Server.IRequestResponseData) {
	return _.includes([301, 302, 303, 307, 308], response.statusCode);
}

export function formatListOfNames(names: string[], conjunction?: string): string {
	conjunction = conjunction === undefined ? "or" : conjunction;
	if (names.length <= 1) {
		return names[0];
	} else {
		return _.initial(names).join(", ") + " " + conjunction + " " + names[names.length - 1];
	}
}

export function getRelativeToRootPath(rootPath: string, filePath: string): string {
	const relativeToRootPath = filePath.substr(rootPath.length);
	return relativeToRootPath;
}

function getVersionArray(version: string | IVersionData): number[] {
	let result: number[] = [];
	const parseLambda = (x: string) => parseInt(x, 10);
	const filterLambda = (x: number) => !isNaN(x);

	if (typeof version === "string") {
		const versionString = <string>version.split("-")[0];
		result = _.map(versionString.split("."), parseLambda);
	} else {
		result = _(version).map(parseLambda).filter(filterLambda).value();
	}

	return result;
}

export function versionCompare(version1: string | IVersionData, version2: string | IVersionData): number {
	const v1array = getVersionArray(version1),
		v2array = getVersionArray(version2);

	if (v1array.length !== v2array.length) {
		throw new Error("Version strings are not in the same format");
	}

	for (let i = 0; i < v1array.length; ++i) {
		if (v1array[i] !== v2array[i]) {
			return v1array[i] > v2array[i] ? 1 : -1;
		}
	}

	return 0;
}

export function isInteractive(): boolean {
	return process.stdout.isTTY && process.stdin.isTTY;
}

export function toBoolean(str: any): boolean {
	return !!(str && str.toString && str.toString().toLowerCase() === "true");
}

export function block(operation: () => void): void {
	if (isInteractive()) {
		(<ReadStream>process.stdin).setRawMode(false);
	}
	operation();
	if (isInteractive()) {
		(<ReadStream>process.stdin).setRawMode(true);
	}
}

export function isNumberWithoutExponent(n: any): boolean {
	const parsedNum = parseFloat(n);
	return !isNaN(parsedNum) && isFinite(n) && n.toString && n.toString() === parsedNum.toString();
}

export function fromWindowsRelativePathToUnix(windowsRelativePath: string): string {
	return windowsRelativePath.replace(/\\/g, "/");
}

export function isNullOrWhitespace(input: any): boolean {
	if (!input && input !== false) {
		return true;
	}

	return _.isString(input) && input.replace(/\s/gi, "").length < 1;
}

export function getCurrentEpochTime(): number {
	const dateTime = new Date();
	return dateTime.getTime();
}

export async function sleep(ms: number): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		setTimeout(async () => resolve(), ms);
	});
}

export function createTable(headers: string[], data: string[][]): any {
	const table = new Table({
		head: headers,
		chars: { "mid": "", "left-mid": "", "mid-mid": "", "right-mid": "" }
	});

	_.forEach(data, row => table.push(row));
	return table;
}

export function remove<T>(array: T[], predicate: (element: T) => boolean, numberOfElements?: number): T[] {
	numberOfElements = numberOfElements || 1;
	const index = _.findIndex(array, predicate);
	if (index === -1) {
		return new Array<T>();
	}

	return <T[]>array.splice(index, numberOfElements);
}

export function trimSymbol(str: string, symbol: string) {
	while (str.charAt(0) === symbol) {
		str = str.substr(1);
	}

	while (str.charAt(str.length - 1) === symbol) {
		str = str.substr(0, str.length - 1);
	}

	return str;
}

export function parseJson(data: string): any {
	// Replace BOM from the header of the file if it exists
	return JSON.parse(data.replace(/^\uFEFF/, ""));
}

// TODO: Use generic for predicatе predicate: (element: T|T[]) when TypeScript support this.
export async function getFuturesResults<T>(promises: Promise<T | T[]>[], predicate: (element: any) => boolean): Promise<T[]> {
	const results = await Promise.all(promises);

	return _(results)
		.filter(predicate)
		.flatten<T>()
		.value();
}

/**
 * Appends zeroes to a version string until it reaches a specified length.
 * @param {string} version The version on which to append zeroes.
 * @param requiredVersionLength The required length of the version string.
 * @returns {string} Appended version string. In case input is null, undefined or empty string, it is returned immediately without appending anything.
 */
export function appendZeroesToVersion(version: string, requiredVersionLength: number): string {
	if (version) {
		const zeroesToAppend = requiredVersionLength - version.split(".").length;
		for (let index = 0; index < zeroesToAppend; index++) {
			version += ".0";
		}
	}

	return version;
}

export function decorateMethod(before: (method1: any, self1: any, args1: any[]) => Promise<any>, after: (method2: any, self2: any, result2: any, args2: any[]) => Promise<any>) {
	return (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>) => {
		const sink = descriptor.value;
		descriptor.value = async function (...args: any[]): Promise<any> {
			let newMethods: Function[] = null;
			if (before) {
				newMethods = await before(sink, this, args);
			}

			let hasBeenReplaced = false;
			let result: any;
			if (newMethods && newMethods.length) {
				const replacementMethods = _.filter(newMethods, f => _.isFunction(f));
				if (replacementMethods.length > 0) {

					hasBeenReplaced = true;
					const chainedReplacementMethod = _.reduce(replacementMethods, (prev, next) => next.bind(next, args, prev), sink.bind(this));
					result = chainedReplacementMethod();
				}
			}

			if (!hasBeenReplaced) {
				result = sink.apply(this, args);
			}

			if (after) {
				return await after(sink, this, result, args);
			}

			return result;
		};
	};
}

export function hook(commandName: string) {
	function getHooksService(self: any): IHooksService {
		let hooksService: IHooksService = self.$hooksService;
		if (!hooksService) {
			const injector = self.$injector;
			if (!injector) {
				throw Error('Type with hooks needs to have either $hooksService or $injector injected.');
			}
			hooksService = injector.resolve('hooksService');
		}
		return hooksService;
	}

	function prepareArguments(method: any, args: any[], hooksService: IHooksService): { [key: string]: any } {
		annotate(method);
		const argHash: any = {};
		for (let i = 0; i < method.$inject.args.length; ++i) {
			argHash[method.$inject.args[i]] = args[i];
		}
		argHash.$arguments = args;
		const result: any = {};
		result[hooksService.hookArgsName] = argHash;

		return result;
	}

	return decorateMethod(
		async (method: any, self: any, args: any[]) => {
			const hooksService = getHooksService(self);
			return hooksService.executeBeforeHooks(commandName, prepareArguments(method, args, hooksService));
		},
		async (method: any, self: any, resultPromise: any, args: any[]) => {
			const result = await resultPromise;
			const hooksService = getHooksService(self);
			await hooksService.executeAfterHooks(commandName, prepareArguments(method, args, hooksService));
			return Promise.resolve(result);
		});
}

export function isPromise(candidateFuture: any): boolean {
	return !!(candidateFuture && typeof (candidateFuture.then) === "function");
}

export async function attachAwaitDetach(eventName: string, eventEmitter: EventEmitter, eventHandler: Function, operation: Promise<any>) {
	eventEmitter.on(eventName, eventHandler);

	try {
		await operation;
	} finally {
		eventEmitter.removeListener(eventName, eventHandler);
	}
}

export async function connectEventually(factory: () => Promise<net.Socket>, handler: (_socket: net.Socket) => void): Promise<void> {
	async function tryConnect() {
		const tryConnectAfterTimeout = setTimeout.bind(undefined, tryConnect, 1000);

		const socket = await factory();
		socket.on("connect", () => {
			socket.removeListener("error", tryConnectAfterTimeout);
			handler(socket);
		});

		socket.on("error", tryConnectAfterTimeout);
	}

	await tryConnect();
}

export function getHash(str: string, options?: { algorithm?: string, encoding?: crypto.HexBase64Latin1Encoding }): string {
	return crypto.createHash(options && options.algorithm || 'sha256').update(str).digest(options && options.encoding || 'hex');
}

export async function connectEventuallyUntilTimeout(factory: () => Promise<net.Socket>, timeout: number): Promise<net.Socket> {
	return new Promise<net.Socket>(async(resolve, reject) => {
		let lastKnownError: Error;
		let isResolved = false;

		setTimeout(function () {
			if (!isResolved) {
				isResolved = true;
				reject(lastKnownError);
			}
		}, timeout);

		async function tryConnect() {
			const tryConnectAfterTimeout = (error: Error) => {
				if (isResolved) {
					return;
				}

				lastKnownError = error;
				setTimeout(tryConnect, 1000);
			};

			const socket = await factory();
			socket.on("connect", () => {
				socket.removeListener("error", tryConnectAfterTimeout);
				isResolved = true;
				resolve(socket);
			});
			socket.on("error", tryConnectAfterTimeout);
		}

		await tryConnect();
	});
}

export function getProjectFilesConfig(opts: { isReleaseBuild: boolean }): IProjectFilesConfig {
	const projectFilesConfig: IProjectFilesConfig = {
		configuration: opts.isReleaseBuild ? Configurations.Release.toLowerCase() : Configurations.Debug.toLowerCase()
	};
	return projectFilesConfig;
}

/**
 * Tries to find the process id (PID) of the specified application identifier.
 * This is specific implementation for iOS Simulator, where the running applications are real processes.
 * Their PIDs are printed in a specific format in the the logs, once the application is started.
 * @param {string} applicationIdentifier Application Identifier of the app for which we try to get the PID.
 * @param {string} logLine Line that may contain the PID of the process.
 * @returns {string} The PID of the searched application identifier in case it's found in the current line, null otherwise.
 */
export function getPidFromiOSSimulatorLogs(applicationIdentifier: string, logLine: string): string {
	if (logLine) {
		const pidRegExp = new RegExp(`${applicationIdentifier}:\\s?(\\d+)`);
		const pidMatch = logLine.match(pidRegExp);
		return pidMatch ? pidMatch[1] : null;
	}

	return null;
}

export function getValueFromNestedObject(obj: any, key: string): any {
	function _getValueRecursive(_obj: any, _key: string): any[] {
		if (_.has(_obj, _key)) {
			return [_obj];
		}

		const res: any[] = [];
		_.forEach(_obj, (v, k) => {
			if (typeof v === "object" && typeof k === "string" && !_.startsWith(k, '$') && !_.endsWith(k.toLowerCase(), "service") && (v = _getValueRecursive(v, _key)).length) {
				res.push.apply(res, v);
			}
		});

		return res;
	}

	return _.head(_getValueRecursive(obj, key));
}

export function getWinRegPropertyValue(key: string, propertyName: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const Winreg = require("winreg");
		const regKey = new Winreg({
			hive: Winreg.HKLM,
			key: key
		});
		regKey.get(propertyName, (err: Error, value: string) => {
			if (err) {
				reject(err);
			} else {
				resolve(value);
			}
		});
	});
}

//--- begin part copied from AngularJS

//The MIT License
//
//Copyright (c) 2010-2012 Google, Inc. http://angularjs.org
//
//Permission is hereby granted, free of charge, to any person obtaining a copy
//of this software and associated documentation files (the "Software"), to deal
//in the Software without restriction, including without limitation the rights
//to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//copies of the Software, and to permit persons to whom the Software is
//furnished to do so, subject to the following conditions:
//
//	The above copyright notice and this permission notice shall be included in
//all copies or substantial portions of the Software.
//
//	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//THE SOFTWARE.

const CLASS_NAME = /class\s+([A-Z].+?)(?:\s+.*?)?\{/;
const CONSTRUCTOR_ARGS = /constructor\s*([^\(]*)\(\s*([^\)]*)\)/m;
const FN_NAME_AND_ARGS = /^(?:function)?\s*([^\(]*)\(\s*([^\)]*)\)\s*(=>)?\s*[{_]/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

export function annotate(fn: any) {
	let $inject: any,
		fnText: string,
		argDecl: string[];

	if (typeof fn === "function") {
		if (!($inject = fn.$inject) || $inject.name !== fn.name) {
			$inject = { args: [], name: "" };
			fnText = fn.toString().replace(STRIP_COMMENTS, '');

			let nameMatch = fnText.match(CLASS_NAME);

			if (nameMatch) {
				argDecl = fnText.match(CONSTRUCTOR_ARGS);
			} else {
				nameMatch = argDecl = fnText.match(FN_NAME_AND_ARGS);
			}

			$inject.name = nameMatch && nameMatch[1];

			if (argDecl && fnText.length) {
				argDecl[2].split(FN_ARG_SPLIT).forEach((arg) => {
					arg.replace(FN_ARG, (all, underscore, name) => $inject.args.push(name));
				});
			}

			fn.$inject = $inject;
		}
	}

	return $inject;
}

//--- end part copied from AngularJS
