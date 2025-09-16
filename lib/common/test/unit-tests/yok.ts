import { assert } from "chai";
import { injector, setGlobalInjector, Yok } from "../../yok";
import * as path from "path";
import * as fs from "fs";
import { mkdtempSync } from "fs";
import { tmpdir } from "os";
import * as _ from "lodash";
import { ICliGlobal } from "../../definitions/cli-global";
import { ICommandParameter } from "../../definitions/commands";
import { IInjector } from "../../definitions/yok";

class MyClass {
	constructor(
		private x: string,
		public y: any,
	) {}

	public checkX(): void {
		assert.strictEqual(this.x, "foo");
	}
}

describe("yok", () => {
	describe("functions", () => {
		it("resolves pre-constructed singleton", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			injector.register("foo", obj);

			const resolved = injector.resolve("foo");

			assert.strictEqual(obj, resolved);
		});

		it("resolves given constructor", () => {
			setGlobalInjector(new Yok());
			let obj: any;
			injector.register("foo", () => {
				obj = { foo: "foo" };
				return obj;
			});

			const resolved = injector.resolve("foo");

			assert.strictEqual(resolved, obj);
		});

		it("resolves constructed singleton", () => {
			setGlobalInjector(new Yok());
			injector.register("foo", { foo: "foo" });

			const r1 = injector.resolve("foo");
			const r2 = injector.resolve("foo");

			assert.strictEqual(r1, r2);
		});

		it("injects directly into passed constructor", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			injector.register("foo", obj);

			function Test(foo: any) {
				this.foo = foo;
			}

			const result = injector.resolve(Test);

			assert.strictEqual(obj, result.foo);
		});

		it("injects directly into passed constructor, ES6 lambda", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			let resultFoo: any = null;

			injector.register("foo", obj);

			const Test = (foo: any) => {
				resultFoo = foo;
			};

			injector.resolve(Test);

			assert.strictEqual(obj, resultFoo);
		});

		it("injects directly into passed constructor, ES6 lambda, constructor args", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			const expectedBar = {};

			let resultFoo: any = null;
			let resultBar: any = null;

			injector.register("foo", obj);

			const Test = (foo: any, bar: any) => {
				resultFoo = foo;
				resultBar = bar;
			};

			injector.resolve(Test, { bar: expectedBar });

			assert.strictEqual(obj, resultFoo);
			assert.strictEqual(expectedBar, resultBar);
		});

		it("inject dependency into registered constructor", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			injector.register("foo", obj);

			function Test(foo: any) {
				this.foo = foo;
			}

			injector.register("test", Test);

			const result = injector.resolve("test");

			assert.strictEqual(obj, result.foo);
		});

		it("inject dependency into registered constructor, ES6 lambda", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			let resultFoo: any = null;

			injector.register("foo", obj);

			const Test = (foo: any) => {
				resultFoo = foo;
			};

			injector.register("test", Test);

			injector.resolve("test");

			assert.strictEqual(obj, resultFoo);
		});

		it("inject dependency into registered constructor, ES6 lambda, constructor args", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			const expectedBar = {};

			let resultFoo: any = null;
			let resultBar: any = null;

			injector.register("foo", obj);

			const Test = (foo: any, bar: any) => {
				resultFoo = foo;
				resultBar = bar;
			};

			injector.register("test", Test);

			injector.resolve("test", { bar: expectedBar });

			assert.strictEqual(obj, resultFoo);
			assert.strictEqual(expectedBar, resultBar);
		});

		it("inject dependency with $ prefix", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			injector.register("foo", obj);

			function Test($foo: any) {
				this.foo = $foo;
			}

			const result = injector.resolve(Test);

			assert.strictEqual(obj, result.foo);
		});

		it("inject into TS constructor", () => {
			setGlobalInjector(new Yok());

			injector.register("x", "foo");
			injector.register("y", 123);

			const result = <MyClass>injector.resolve(MyClass);

			assert.strictEqual(result.y, 123);
			result.checkX();
		});

		it("resolves a parameterless constructor", () => {
			setGlobalInjector(new Yok());

			function Test() {
				this.foo = "foo";
			}

			const result = injector.resolve(Test);

			assert.equal(result.foo, "foo");
		});

		it("returns null when it can't resolve a command", () => {
			setGlobalInjector(new Yok());
			const command = injector.resolveCommand("command");
			assert.isNull(command);
		});

		it("throws when it can't resolve a registered command", () => {
			setGlobalInjector(new Yok());

			function Command(whatever: any) {
				/* intentionally left blank */
			}

			injector.registerCommand("command", Command);

			assert.throws(() => injector.resolveCommand("command"));
		});

		it("disposes", () => {
			setGlobalInjector(new Yok());

			function Thing() {
				/* intentionally left blank */
			}

			Thing.prototype.dispose = function () {
				this.disposed = true;
			};

			injector.register("thing", Thing);
			const thing = injector.resolve("thing");
			injector.dispose();

			assert.isTrue(thing.disposed);
		});

		it("disposes all instances", () => {
			setGlobalInjector(new Yok());

			function Thing(arg: string) {
				this.arg = arg; /* intentionally left blank */
			}

			Thing.prototype.dispose = function () {
				this.disposed = true;
			};

			injector.register("thing", Thing, false);
			const thing1 = injector.resolve("thing", { arg: "thing1" });
			const thing2 = injector.resolve("thing", { arg: "thing2" });
			const thing3 = injector.resolve("thing", { arg: "thing3" });

			assert.equal(thing1.arg, "thing1");
			assert.equal(thing2.arg, "thing2");
			assert.equal(thing3.arg, "thing3");
			injector.dispose();

			assert.isTrue(thing1.disposed);
			assert.isTrue(thing2.disposed);
			assert.isTrue(thing3.disposed);
		});
	});

	describe("classes", () => {
		it("resolves pre-constructed singleton", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			injector.register("foo", obj);

			const resolved = injector.resolve("foo");

			assert.strictEqual(obj, resolved);
		});

		it("resolves given constructor", () => {
			setGlobalInjector(new Yok());
			let obj: any;
			injector.register("foo", () => {
				obj = { foo: "foo" };
				return obj;
			});

			const resolved = injector.resolve("foo");

			assert.strictEqual(resolved, obj);
		});

		it("resolves constructed singleton", () => {
			setGlobalInjector(new Yok());
			injector.register("foo", { foo: "foo" });

			const r1 = injector.resolve("foo");
			const r2 = injector.resolve("foo");

			assert.strictEqual(r1, r2);
		});

		it("injects directly into passed constructor", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			injector.register("foo", obj);

			class Test {
				public foo: any;

				constructor(foo: any) {
					this.foo = foo;
				}
			}

			const result = injector.resolve(Test);
			assert.strictEqual(obj, result.foo);
		});

		it("injects directly into passed constructor, constructor args", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			const expectedBar = {};

			injector.register("foo", obj);

			class Test {
				public foo: any;
				public bar: any;

				constructor(foo: any, bar: any) {
					this.foo = foo;
					this.bar = bar;
				}
			}

			const result = injector.resolve(Test, { bar: expectedBar });

			assert.strictEqual(obj, result.foo);
			assert.strictEqual(expectedBar, result.bar);
		});

		it("inject dependency into registered constructor", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			injector.register("foo", obj);

			class Test {
				public foo: any;

				constructor(foo: any) {
					this.foo = foo;
				}
			}

			injector.register("test", Test);

			const result = injector.resolve("test");

			assert.strictEqual(obj, result.foo);
		});

		it("inject dependency into registered constructor, constructor args", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			const expectedBar = {};

			injector.register("foo", obj);

			class Test {
				public foo: any;
				public bar: any;

				constructor(foo: any, bar: any) {
					this.foo = foo;
					this.bar = bar;
				}
			}

			injector.register("test", Test);

			const result = injector.resolve("test", { bar: expectedBar });

			assert.strictEqual(obj, result.foo);
			assert.strictEqual(expectedBar, result.bar);
		});

		it("inject dependency with $ prefix", () => {
			setGlobalInjector(new Yok());
			const obj = {};
			injector.register("foo", obj);

			class Test {
				public foo: any;
				constructor($foo: any) {
					this.foo = $foo;
				}
			}

			const result = injector.resolve(Test);

			assert.strictEqual(obj, result.foo);
		});

		it("inject into TS constructor", () => {
			setGlobalInjector(new Yok());

			injector.register("x", "foo");
			injector.register("y", 123);

			const result = <MyClass>injector.resolve(MyClass);

			assert.strictEqual(result.y, 123);
			result.checkX();
		});

		it("resolves a parameterless constructor", () => {
			setGlobalInjector(new Yok());

			class Test {
				public foo: any;
				constructor() {
					this.foo = "foo";
				}
			}

			const result = injector.resolve(Test);

			assert.equal(result.foo, "foo");
		});

		it("returns null when it can't resolve a command", () => {
			setGlobalInjector(new Yok());
			const command = injector.resolveCommand("command");
			assert.isNull(command);
		});

		it("throws when it can't resolve a registered command", () => {
			setGlobalInjector(new Yok());

			class Command {
				constructor(whatever: any) {
					/* intentionally left blank */
				}
			}

			injector.registerCommand("command", Command);

			assert.throws(() => injector.resolveCommand("command"));
		});

		it("disposes", () => {
			setGlobalInjector(new Yok());

			class Thing {
				public disposed = false;

				public dispose() {
					this.disposed = true;
				}
			}

			injector.register("thing", Thing);
			const thing = injector.resolve("thing");
			injector.dispose();

			assert.isTrue(thing.disposed);
		});
	});

	it("throws error when module is required more than once and overrideAlreadyRequiredModule is false", () => {
		setGlobalInjector(new Yok());
		injector.require("foo", "test");
		injector.overrideAlreadyRequiredModule = false;
		assert.throws(() => injector.require("foo", "test2"));
	});

	it("overrides module when it is required more than once and overrideAlreadyRequiredModule is true", () => {
		setGlobalInjector(new Yok());
		const cliGlobal = <ICliGlobal>(<unknown>global);
		const injectorCache = cliGlobal.$injector;
		cliGlobal.$injector = injector;
		const tmpDirA = mkdtempSync(
			path.join(tmpdir(), "overrideAlreadyRequiredModule_fileA-"),
		);
		const tmpPathA = path.join(tmpDirA, "fileA.js");
		fs.writeFileSync(
			tmpPathA,
			`
"use strict";

class A {
	constructor() {
			this.test = 1;
	}
}
$injector.register("a", A);
			`,
		);

		injector.require("a", tmpPathA);

		const tmpDirB = mkdtempSync(
			path.join(tmpdir(), "overrideAlreadyRequiredModule_fileB-"),
		);
		const tmpPathB = path.join(tmpDirB, "fileB.js");
		fs.writeFileSync(
			tmpPathB,
			`
"use strict";

class A {
	constructor() {
			this.test = 2;
	}
}
$injector.register("a", A);
			`,
		);

		injector.overrideAlreadyRequiredModule = true;

		assert.doesNotThrow(() => injector.require("a", tmpPathB));

		const result: any = injector.resolve("a");
		assert.deepStrictEqual(result.test, 2);
		cliGlobal.$injector = injectorCache;
	});

	describe("requirePublic", () => {
		it("adds module to public api when requirePublic is used", () => {
			setGlobalInjector(new Yok());
			injector.requirePublic("foo", "test");
			assert.isTrue(
				_.includes(Object.getOwnPropertyNames(injector.publicApi), "foo"),
			);
		});

		it("resolves correct module, when publicApi is accessed", async () => {
			// The test have to verify that when $injector.requirePublic is used, the $injector will require the file when you try to access the module from publicApi
			// However there are several problems with testing this functionality (it is used when you require this package, so there should be some integration tests).
			// We cannot use `$injector.requirePublic("testPublicApi", pathToMock)` directly as the file is already required by mocha,
			// so when $injector tries to resolve it, it will fail, as cannot require the module twice.
			// So we have to create a new file, as all files inside test dir are required by mocha before starting the tests.
			// The file is created in temp dir, but this requires modification of the import statements in it.
			// Also we have to modify the global $injector, so when the file is required, the $injector.register... will be the same injector that we are testing.

			const injectorCache = injector;
			setGlobalInjector(new Yok());

			const tempDir = mkdtempSync(
				path.join(tmpdir(), "overrideAlreadyRequiredModule_fileA-"),
			);
			const testPublicApiFilePath = path.join(tempDir, "public-api-mocks.js");
			const pathToMock = path.join(__dirname, "mocks", "public-api-mocks.js");
			const originalContent = fs.readFileSync(pathToMock).toString();

			// On Windows we are unable to require paths with single backslash, so replace them with double backslashes.
			const correctPathToRequireDecorators =
				"'" +
				path.join(__dirname, "..", "..", "decorators").replace(/\\/g, "\\\\") +
				"'";
			const correctPathToRequireYok =
				"'" +
				path.join(__dirname, "..", "..", "yok").replace(/\\/g, "\\\\") +
				"'";
			const fixedContent = originalContent
				.replace(/".+?decorators"/, correctPathToRequireDecorators)
				.replace(/".+?yok"/, correctPathToRequireYok);
			fs.writeFileSync(testPublicApiFilePath, fixedContent);

			injector.requirePublic("testPublicApi", testPublicApiFilePath);

			const result = 1;
			assert.ok(
				injector.publicApi.testPublicApi,
				"The module testPublicApi must be resolved in its getter and the returned value should not be falsey.",
			);
			assert.deepStrictEqual(
				await injector.publicApi.testPublicApi.myMethod(result),
				result,
			);

			setGlobalInjector(injectorCache);
		});
	});

	describe("isValidHierarchicalCommand", () => {
		let localInjector: IInjector;
		beforeEach(() => {
			localInjector = new Yok();
		});

		describe("returns true", () => {
			describe("when command consists of two parts", () => {
				it("and is valid", () => {
					localInjector.requireCommand("sample|command", "sampleFileName");
					return assert.eventually.isTrue(
						localInjector.isValidHierarchicalCommand("sample", ["command"]),
					);
				});

				it("and has default value and no arguments passed", () => {
					localInjector.requireCommand("sample|*default", "sampleFileName");
					return assert.eventually.isTrue(
						localInjector.isValidHierarchicalCommand("sample", []),
					);
				});

				it("and has default value and canExecute returns true", () => {
					const command = {
						canExecute: async () => true,
					};
					localInjector.registerCommand("sample|*default", command);
					localInjector.requireCommand("sample|*default", "sampleFileName");
					return assert.eventually.isTrue(
						localInjector.isValidHierarchicalCommand("sample", ["arg"]),
					);
				});

				it("and has default value and allowedParameters' length is greater than 0", () => {
					const allowedParameters: ICommandParameter[] = [
						{ mandatory: false, validate: async () => true },
					];
					const command = {
						allowedParameters,
					};
					localInjector.registerCommand("sample|*default", command);
					localInjector.requireCommand("sample|*default", "sampleFileName");
					return assert.eventually.isTrue(
						localInjector.isValidHierarchicalCommand("sample", ["arg"]),
					);
				});

				it("and has default value and argument default passed", () => {
					localInjector.requireCommand("sample|*default", "sampleFileName");
					return assert.eventually.isTrue(
						localInjector.isValidHierarchicalCommand("sample", ["default"]),
					);
				});

				it("and has default value and some arguments passed", () => {
					localInjector.requireCommand("sample|*default", "sampleFileName");
					return assert.eventually.isTrue(
						localInjector.isValidHierarchicalCommand("sample", [
							"arg1",
							"arg2",
						]),
					);
				});
			});

			describe("when command consists of multiple parts", () => {
				it("and is valid", () => {
					localInjector.requireCommand(
						"sample|command|subcommand",
						"sampleFileName",
					);
					return assert.eventually.isTrue(
						localInjector.isValidHierarchicalCommand("sample", [
							"command",
							"subcommand",
						]),
					);
				});

				it("and has default value and no arguments passed", () => {
					localInjector.requireCommand(
						"sample|command|*default",
						"sampleFileName",
					);
					return assert.eventually.isTrue(
						localInjector.isValidHierarchicalCommand("sample", ["command"]),
					);
				});

				it("has default value and default argument passed", () => {
					localInjector.requireCommand(
						"sample|command|*default",
						"sampleFileName",
					);
					return assert.eventually.isTrue(
						localInjector.isValidHierarchicalCommand("sample", [
							"command",
							"default",
						]),
					);
				});

				it("has default value and some arguments passed", () => {
					localInjector.requireCommand(
						"sample|command|*default",
						"sampleFileName",
					);
					return assert.eventually.isTrue(
						localInjector.isValidHierarchicalCommand("sample", [
							"command",
							"arg1",
							"arg2",
						]),
					);
				});
			});
		});

		describe("returns false", () => {
			it("when command is invalid", () => {
				localInjector.requireCommand("sample|command", "sampleFileName");
				return assert.eventually.isFalse(
					localInjector.isValidHierarchicalCommand("wrong", ["command"]),
				);
			});

			describe("throws", () => {
				it("when arguments are invalid", () => {
					localInjector.requireCommand("sample|command", "sampleFileName");
					return assert.isRejected(
						localInjector.isValidHierarchicalCommand("sample", ["commandarg"]),
					);
				});
			});
		});
	});

	describe("buildHierarchicalCommand", () => {
		beforeEach(() => {
			setGlobalInjector(new Yok());
		});

		describe("returns undefined", () => {
			it("when there's no valid hierarchical command", () => {
				injector.requireCommand("sample|command", "sampleFileName");
				assert.isUndefined(
					injector.buildHierarchicalCommand("command", ["subCommand"]),
					"When there's no matching subcommand, buildHierarchicalCommand should return undefined.",
				);
			});

			it("when there's no hierarchical commands required", () => {
				assert.isUndefined(
					injector.buildHierarchicalCommand("command", ["subCommand"]),
					"When there's no hierarchical commands required, buildHierarchicalCommand should return undefined.",
				);
			});

			it("when only one argument is passed", () => {
				assert.isUndefined(
					injector.buildHierarchicalCommand("command", []),
					"When when only one argument is passed, buildHierarchicalCommand should return undefined.",
				);
			});

			it("when there's matching command, but it is not hierarchical command", () => {
				injector.requireCommand("command", "sampleFileName");
				assert.isUndefined(
					injector.buildHierarchicalCommand("command", []),
					"When there's matching command, but it is not hierarchical command, buildHierarchicalCommand should return undefined.",
				);
			});
		});

		describe("returns correct command and arguments when command name has one pipe (|)", () => {
			it("when only command is passed, no arguments are returned", () => {
				const commandName = "sample|command";
				injector.requireCommand(commandName, "sampleFileName");
				const buildHierarchicalCommandResult =
					injector.buildHierarchicalCommand("sample", ["command"]);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.commandName,
					commandName,
					`The expected command name is ${commandName}`,
				);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.remainingArguments,
					[],
					"There shouldn't be any arguments left.",
				);
			});

			it("when command is passed, correct arguments are returned", () => {
				const commandName = "sample|command";
				injector.requireCommand(commandName, "sampleFileName");
				const sampleArguments = [
					"sample",
					"arguments",
					"passed",
					"to",
					"command",
				];
				const buildHierarchicalCommandResult =
					injector.buildHierarchicalCommand(
						"sample",
						["command"].concat(sampleArguments),
					);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.commandName,
					commandName,
					`The expected command name is ${commandName}`,
				);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.remainingArguments,
					sampleArguments,
					"All arguments except first one should be returned.",
				);
			});

			it("when command is passed, correct arguments are returned when command argument has uppercase letters", () => {
				const commandName = "sample|command";
				injector.requireCommand(commandName, "sampleFileName");
				const sampleArguments = [
					"sample",
					"arguments",
					"passed",
					"to",
					"command",
				];
				const buildHierarchicalCommandResult =
					injector.buildHierarchicalCommand(
						"sample",
						["CoMmanD"].concat(sampleArguments),
					);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.commandName,
					commandName,
					`The expected command name is ${commandName}`,
				);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.remainingArguments,
					sampleArguments,
					"All arguments except first one should be returned.",
				);
			});

			it("when only default command is passed, no arguments are returned", () => {
				const commandName = "sample|*command";
				injector.requireCommand(commandName, "sampleFileName");
				const buildHierarchicalCommandResult =
					injector.buildHierarchicalCommand("sample", ["command"]);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.commandName,
					commandName,
					`The expected command name is ${commandName}`,
				);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.remainingArguments,
					[],
					"There shouldn't be any arguments left.",
				);
			});

			it("when default command is passed, correct arguments are returned", () => {
				const commandName = "sample|*command";
				injector.requireCommand(commandName, "sampleFileName");
				const sampleArguments = [
					"sample",
					"arguments",
					"passed",
					"to",
					"command",
				];
				const buildHierarchicalCommandResult =
					injector.buildHierarchicalCommand(
						"sample",
						["command"].concat(sampleArguments),
					);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.commandName,
					commandName,
					`The expected command name is ${commandName}`,
				);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.remainingArguments,
					sampleArguments,
					"All arguments except first one should be returned.",
				);
			});
		});

		describe("returns correct command and arguments when command name has more than one pipe (|)", () => {
			it("when only command is passed, no arguments are returned", () => {
				const commandName = "sample|command|with|more|pipes";
				injector.requireCommand(commandName, "sampleFileName");
				const buildHierarchicalCommandResult =
					injector.buildHierarchicalCommand("sample", [
						"command",
						"with",
						"more",
						"pipes",
					]);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.commandName,
					commandName,
					`The expected command name is ${commandName}`,
				);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.remainingArguments,
					[],
					"There shouldn't be any arguments left.",
				);
			});

			it("when command is passed, correct arguments are returned", () => {
				const commandName = "sample|command|pipes";
				injector.requireCommand(commandName, "sampleFileName");
				const sampleArguments = [
					"sample",
					"arguments",
					"passed",
					"to",
					"command",
				];
				const buildHierarchicalCommandResult =
					injector.buildHierarchicalCommand(
						"sample",
						["command", "pipes"].concat(sampleArguments),
					);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.commandName,
					commandName,
					`The expected command name is ${commandName}`,
				);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.remainingArguments,
					sampleArguments,
					"All arguments except the ones used for commandName should be returned.",
				);
			});

			it("when only default command is passed, no arguments are returned", () => {
				const commandName = "sample|*command|pipes";
				injector.requireCommand(commandName, "sampleFileName");
				const buildHierarchicalCommandResult =
					injector.buildHierarchicalCommand("sample", ["command", "pipes"]);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.commandName,
					commandName,
					`The expected command name is ${commandName}`,
				);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.remainingArguments,
					[],
					"There shouldn't be any arguments left.",
				);
			});

			it("when default command is passed, correct arguments are returned", () => {
				const commandName = "sample|*command|pipes";
				injector.requireCommand(commandName, "sampleFileName");
				const sampleArguments = [
					"sample",
					"arguments",
					"passed",
					"to",
					"command",
				];
				const buildHierarchicalCommandResult =
					injector.buildHierarchicalCommand(
						"sample",
						["command", "pipes"].concat(sampleArguments),
					);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.commandName,
					commandName,
					`The expected command name is ${commandName}`,
				);
				assert.deepStrictEqual(
					buildHierarchicalCommandResult.remainingArguments,
					sampleArguments,
					"All arguments except the ones used for commandName should be returned.",
				);
			});

			describe("returns most applicable hierarchical command", () => {
				const sampleArguments = [
					"sample",
					"arguments",
					"passed",
					"to",
					"command",
				];
				beforeEach(() => {
					injector.requireCommand("sample|command", "sampleFileName");
					injector.requireCommand("sample|command|with", "sampleFileName");
					injector.requireCommand("sample|command|with|more", "sampleFileName");
					injector.requireCommand(
						"sample|command|with|more|pipes",
						"sampleFileName",
					);
				});
				it("when subcommand of subcommand is called", () => {
					const commandName = "sample|command|with|more|pipes";
					const buildHierarchicalCommandResult =
						injector.buildHierarchicalCommand("sample", [
							"command",
							"with",
							"more",
							"pipes",
						]);
					assert.deepStrictEqual(
						buildHierarchicalCommandResult.commandName,
						commandName,
						`The expected command name is ${commandName}`,
					);
					assert.deepStrictEqual(
						buildHierarchicalCommandResult.remainingArguments,
						[],
						"There shouldn't be any arguments left.",
					);
				});

				it("and correct arguments, when subcommand of subcommand is called", () => {
					const commandName = "sample|command|with|more|pipes";
					const buildHierarchicalCommandResult =
						injector.buildHierarchicalCommand(
							"sample",
							["command", "with", "more", "pipes"].concat(sampleArguments),
						);
					assert.deepStrictEqual(
						buildHierarchicalCommandResult.commandName,
						commandName,
						`The expected command name is ${commandName}`,
					);
					assert.deepStrictEqual(
						buildHierarchicalCommandResult.remainingArguments,
						sampleArguments,
						"All arguments except the ones used for commandName should be returned.",
					);
				});

				it("when top subcommand is called and it has its own subcommand", () => {
					const commandName = "sample|command";
					const buildHierarchicalCommandResult =
						injector.buildHierarchicalCommand("sample", ["command"]);
					assert.deepStrictEqual(
						buildHierarchicalCommandResult.commandName,
						commandName,
						`The expected command name is ${commandName}`,
					);
					assert.deepStrictEqual(
						buildHierarchicalCommandResult.remainingArguments,
						[],
						"There shouldn't be any arguments left.",
					);
				});

				it("and correct arguments, when top subcommand is called and it has its own subcommand", () => {
					const commandName = "sample|command";
					const buildHierarchicalCommandResult =
						injector.buildHierarchicalCommand(
							"sample",
							["command"].concat(sampleArguments),
						);
					assert.deepStrictEqual(
						buildHierarchicalCommandResult.commandName,
						commandName,
						`The expected command name is ${commandName}`,
					);
					assert.deepStrictEqual(
						buildHierarchicalCommandResult.remainingArguments,
						sampleArguments,
						"All arguments except the ones used for commandName should be returned.",
					);
				});

				it("when subcommand of subcommand is called and it has its own subcommand", () => {
					const commandName = "sample|command|with";
					const buildHierarchicalCommandResult =
						injector.buildHierarchicalCommand("sample", ["command", "with"]);
					assert.deepStrictEqual(
						buildHierarchicalCommandResult.commandName,
						commandName,
						`The expected command name is ${commandName}`,
					);
					assert.deepStrictEqual(
						buildHierarchicalCommandResult.remainingArguments,
						[],
						"There shouldn't be any arguments left.",
					);
				});

				it("and correct arguments, when subcommand of subcommand is called and it has its own subcommand", () => {
					const commandName = "sample|command|with";
					const buildHierarchicalCommandResult =
						injector.buildHierarchicalCommand(
							"sample",
							["command", "with"].concat(sampleArguments),
						);
					assert.deepStrictEqual(
						buildHierarchicalCommandResult.commandName,
						commandName,
						`The expected command name is ${commandName}`,
					);
					assert.deepStrictEqual(
						buildHierarchicalCommandResult.remainingArguments,
						sampleArguments,
						"All arguments except the ones used for commandName should be returned.",
					);
				});
			});
		});
	});

	it("adds whole class to public api when requirePublicClass is used", () => {
		setGlobalInjector(new Yok());
		const dataObject = {
			a: "testA",
			b: {
				c: "testC",
			},
		};

		const filepath = path.join(__dirname, "..", "..", "temp.js");
		fs.writeFileSync(filepath, "");

		// Call to requirePublicClass will add the class to publicApi object.
		injector.requirePublicClass("foo", "./temp");
		injector.register("foo", dataObject);
		// Get the real instance here, so we can delete the file before asserts.
		// This way we'll keep the directory clean, even if assert fails.
		const resultFooObject = injector.publicApi.foo;
		fs.unlinkSync(filepath);
		assert.isTrue(
			_.includes(Object.getOwnPropertyNames(injector.publicApi), "foo"),
		);
		assert.deepStrictEqual(resultFooObject, dataObject);
	});
});
