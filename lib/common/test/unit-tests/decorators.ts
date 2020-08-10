import * as decoratorsLib from "../../decorators";
import { Yok } from "../../yok";
import { assert } from "chai";
import { CacheDecoratorsTest } from "./mocks/decorators-cache";
import { InvokeBeforeDecoratorsTest } from "./mocks/decorators-invoke-before";
import { isPromise } from "../../helpers";
import * as stubs from "../../../../test/stubs";
import * as sinon from "sinon";
import { PerformanceService } from "../../../services/performance-service";
import { IInjector } from "../../definitions/yok";
import { injector } from "../../yok";
import * as _ from 'lodash';

describe("decorators", () => {
	const moduleName = "moduleName"; // This is the name of the injected dependency that will be resolved, for example fs, devicesService, etc.
	const propertyName = "propertyName"; // This is the name of the method/property from the resolved module
	const expectedResults: any[] = [
		"string result",
		1,
		{ a: 1, b: "2" },
		["string 1", "string2"],
		true,
		undefined,
		null
	];

	beforeEach(() => {
		(<any>global).$injector = new Yok();
		injector.register("performanceService", stubs.PerformanceService);
	});

	after(() => {
		// Make sure global $injector is clean for next tests that will be executed.
		(<any>global).$injector = new Yok();
	});

	describe("exported", () => {

		const generatePublicApiFromExportedDecorator = () => {
			assert.deepEqual(injector.publicApi.__modules__[moduleName], undefined);
			const resultFunction: any = decoratorsLib.exported(moduleName);
			// Call this line in order to generate publicApi and get the real result
			resultFunction({}, propertyName, {});
		};

		it("returns function", () => {
			const result: any = decoratorsLib.exported("test");
			assert.equal(typeof (result), "function");
		});

		it("does not change original method", () => {
			const exportedFunctionResult: any = decoratorsLib.exported(moduleName);
			const expectedResult = { "originalObject": "originalValue" };
			const actualResult = exportedFunctionResult({}, "myTest1", expectedResult);
			assert.deepEqual(actualResult, expectedResult);
		});

		_.each(expectedResults, (expectedResult: any) => {
			it(`returns correct result when function returns ${_.isArray(expectedResult) ? "array" : typeof (expectedResult)}`, () => {
				injector.register(moduleName, { propertyName: () => expectedResult });
				generatePublicApiFromExportedDecorator();
				const actualResult: any = injector.publicApi.__modules__[moduleName][propertyName]();
				assert.deepEqual(actualResult, expectedResult);
			});

			it(`passes correct arguments to original function, when argument type is: ${_.isArray(expectedResult) ? "array" : typeof (expectedResult)}`, () => {
				injector.register(moduleName, { propertyName: (arg: any) => arg });
				generatePublicApiFromExportedDecorator();
				const actualResult: any = injector.publicApi.__modules__[moduleName][propertyName](expectedResult);
				assert.deepEqual(actualResult, expectedResult);
			});
		});

		it("returns Promise, which is resolved to correct value (function without arguments)", (done: mocha.Done) => {
			const expectedResult = "result";
			injector.register(moduleName, { propertyName: async () => expectedResult });
			generatePublicApiFromExportedDecorator();

			const promise: any = injector.publicApi.__modules__[moduleName][propertyName]();
			promise.then((val: string) => {
				assert.deepEqual(val, expectedResult);
			}).then(done).catch(done);
		});

		it("returns Promise, which is resolved to correct value (function with arguments)", (done: mocha.Done) => {
			const expectedArgs = ["result", "result1", "result2"];
			injector.register(moduleName, { propertyName: async (functionArgs: string[]) => functionArgs });
			generatePublicApiFromExportedDecorator();

			const promise: any = injector.publicApi.__modules__[moduleName][propertyName](expectedArgs);
			promise.then((val: string[]) => {
				assert.deepEqual(val, expectedArgs);
			}).then(done).catch(done);
		});

		it("returns Promise, which is resolved to correct value (function returning Promise without arguments)", (done: mocha.Done) => {
			const expectedResult = "result";
			injector.register(moduleName, { propertyName: async () => expectedResult });
			generatePublicApiFromExportedDecorator();

			const promise: any = injector.publicApi.__modules__[moduleName][propertyName]();
			promise.then((val: string) => {
				assert.deepEqual(val, expectedResult);
			}).then(done).catch(done);
		});

		it("returns Promise, which is resolved to correct value (function returning Promise with arguments)", (done: mocha.Done) => {
			const expectedArgs = ["result", "result1", "result2"];
			injector.register(moduleName, { propertyName: async (args: string[]) => args });
			generatePublicApiFromExportedDecorator();

			const promise: any = injector.publicApi.__modules__[moduleName][propertyName](expectedArgs);
			promise.then((val: string[]) => {
				assert.deepEqual(val, expectedArgs);
			}).then(done).catch(done);
		});

		it("rejects Promise, which is resolved to correct error (function without arguments throws)", (done: mocha.Done) => {
			const expectedError = new Error("Test msg");
			injector.register(moduleName, { propertyName: async () => { throw expectedError; } });
			generatePublicApiFromExportedDecorator();

			const promise: any = injector.publicApi.__modules__[moduleName][propertyName]();
			promise.then((result: any) => {
				throw new Error("Then method MUST not be called when promise is rejected!");
			}, (err: Error) => {
				assert.deepEqual(err, expectedError);
			}).then(done).catch(done);
		});

		it("rejects Promise, which is resolved to correct error (function returning Promise without arguments throws)", (done: mocha.Done) => {
			const expectedError = new Error("Test msg");
			injector.register(moduleName, { propertyName: async () => { throw expectedError; } });
			generatePublicApiFromExportedDecorator();

			const promise: any = injector.publicApi.__modules__[moduleName][propertyName]();
			promise.then((result: any) => {
				throw new Error("Then method MUST not be called when promise is rejected!");
			}, (err: Error) => {
				assert.deepEqual(err.message, expectedError.message);
			}).then(done).catch(done);
		});

		it("returns Promises, which are resolved to correct value (function returning Promise<T>[] without arguments)", (done: mocha.Done) => {
			const expectedResultsArr = ["result1", "result2", "result3"];
			injector.register(moduleName, { propertyName: () => _.map(expectedResultsArr, async expectedResult => expectedResult) });
			generatePublicApiFromExportedDecorator();

			const promises: Promise<string>[] = injector.publicApi.__modules__[moduleName][propertyName]();
			Promise.all<string>(promises)
				.then((promiseResults: string[]) => {
					_.each(promiseResults, (val: string, index: number) => {
						assert.deepEqual(val, expectedResultsArr[index]);
					});
				})
				.then(() => done())
				.catch(done);
		});

		it("rejects Promises, which are resolved to correct error (function returning Promise<T>[] without arguments throws)", (done: mocha.Done) => {
			const expectedErrors = [new Error("result1"), new Error("result2"), new Error("result3")];
			injector.register(moduleName, { propertyName: () => _.map(expectedErrors, async expectedError => { throw expectedError; }) });
			generatePublicApiFromExportedDecorator();

			new Promise((onFulfilled: Function, onRejected: Function) => {
				const promises: Promise<string>[] = injector.publicApi.__modules__[moduleName][propertyName]();
				_.each(promises, (promise, index) => promise.then((result: any) => {
					onRejected(new Error(`Then method MUST not be called when promise is rejected!. Result of promise is: ${result}`));
				}, (err: Error) => {
					if (err.message !== expectedErrors[index].message) {
						onRejected(new Error(`Error message of rejected promise is not the expected one: expected: "${expectedErrors[index].message}", but was: "${err.message}".`));
					}

					if (index + 1 === expectedErrors.length) {
						onFulfilled();
					}
				}));
			}).then(done).catch(done);
		});

		it("rejects only Promises which throw, resolves the others correctly (function returning Promise<T>[] without arguments)", (done: mocha.Done) => {
			const expectedResultsArr: any[] = ["result1", new Error("result2")];
			injector.register(moduleName, { propertyName: () => _.map(expectedResultsArr, async expectedResult => expectedResult) });
			generatePublicApiFromExportedDecorator();

			new Promise((onFulfilled: Function, onRejected: Function) => {
				const promises: Promise<string>[] = injector.publicApi.__modules__[moduleName][propertyName]();
				_.each(promises, (promise, index) => promise.then((val: string) => {
					assert.deepEqual(val, expectedResultsArr[index]);
					if (index + 1 === expectedResultsArr.length) {
						onFulfilled();
					}
				}, (err: Error) => {
					assert.deepEqual(err.message, expectedResultsArr[index].message);
					if (index + 1 === expectedResultsArr.length) {
						onFulfilled();
					}
				}));
			}).then(done).catch(done);
		});

		it("when function throws, raises the error only when the public API is called, not when decorator is applied", () => {
			const errorMessage = "This is error message";
			injector.register(moduleName, { propertyName: () => { throw new Error(errorMessage); } });
			generatePublicApiFromExportedDecorator();
			assert.throws(() => injector.publicApi.__modules__[moduleName][propertyName](), errorMessage);
		});
	});

	describe("cache", () => {
		it("executes implementation of method only once and returns the same result each time whent it is called (number return type)", () => {
			let count = 0;
			const descriptor: TypedPropertyDescriptor<any> = {
				value: (num: string) => { count++; return num; },
			};

			// cache calling of propertyName as if it's been method.
			const declaredMethod = decoratorsLib.cache()({}, propertyName, descriptor);
			const expectedResult = 5;
			const actualResult = declaredMethod.value(expectedResult);
			assert.deepEqual(actualResult, expectedResult);

			_.range(10).forEach(iteration => {
				const currentResult = declaredMethod.value(iteration);
				assert.deepEqual(currentResult, expectedResult);
			});

			assert.deepEqual(count, 1);
		});

		it("works per instance", () => {
			const instance1 = new CacheDecoratorsTest();
			const expectedResultForInstance1 = 1;
			assert.deepEqual(instance1.method(expectedResultForInstance1), expectedResultForInstance1); // the first call should give us the expected result. all consecutive calls must return the same result.

			_.range(10).forEach(iteration => {
				const currentResult = instance1.method(iteration);
				assert.deepEqual(currentResult, expectedResultForInstance1);
			});

			assert.deepEqual(instance1.counter, 1);

			const instance2 = new CacheDecoratorsTest();
			const expectedResultForInstance2 = 2;
			assert.deepEqual(instance2.method(expectedResultForInstance2), expectedResultForInstance2, "Instance 2 should return new result."); // the first call should give us the expected result. all consecutive calls must return the same result.

			_.range(10).forEach(iteration => {
				const currentResult = instance2.method(iteration);
				assert.deepEqual(currentResult, expectedResultForInstance2);
			});

			assert.deepEqual(instance2.counter, 1);
		});

		it("works with method returning promise", async () => {
			const instance1 = new CacheDecoratorsTest();
			const expectedResultForInstance1 = 1;
			assert.deepEqual(await instance1.promisifiedMethod(expectedResultForInstance1), expectedResultForInstance1); // the first call should give us the expected result. all consecutive calls must return the same result.

			for (let iteration = 0; iteration < 10; iteration++) {
				const promise = instance1.promisifiedMethod(iteration);
				assert.isTrue(isPromise(promise), "Returned result from the decorator should be promise.");
				const currentResult = await promise;
				assert.deepEqual(currentResult, expectedResultForInstance1);
			}

			assert.deepEqual(instance1.counter, 1);
		});

		it("works with getters", () => {
			const instance1 = new CacheDecoratorsTest();
			const expectedResultForInstance1 = 1;
			instance1._property = expectedResultForInstance1;
			assert.deepEqual(instance1.property, expectedResultForInstance1); // the first call should give us the expected result. all consecutive calls must return the same result.

			for (let iteration = 0; iteration < 10; iteration++) {
				instance1._property = iteration;
				assert.deepEqual(instance1.property, expectedResultForInstance1);
			}

			assert.deepEqual(instance1.counter, 1);
		});
	});

	describe("invokeBefore", () => {
		describe("calls method before calling decorated method", () => {
			const assertIsCalled = async (methodName: string): Promise<void> => {
				const instance: any = new InvokeBeforeDecoratorsTest();
				assert.isFalse(instance.isInvokeBeforeMethodCalled);
				const expectedResult = 1;
				assert.deepEqual(await instance[methodName](expectedResult), expectedResult);
				assert.isTrue(instance.isInvokeBeforeMethodCalled);
			};

			it("when invokeBefore method is sync", async () => {
				await assertIsCalled("method");
			});

			it("when invokeBefore method returns Promise", async () => {
				await assertIsCalled("methodPromisifiedInvokeBefore");
			});
		});

		describe("calls method each time before calling decorated method", () => {
			const assertIsCalled = async (methodName: string): Promise<void> => {
				const instance: any = new InvokeBeforeDecoratorsTest();
				assert.isFalse(instance.isInvokeBeforeMethodCalled);
				const expectedResult = 1;
				assert.deepEqual(await instance[methodName](expectedResult), expectedResult);
				assert.isTrue(instance.isInvokeBeforeMethodCalled);

				instance.invokedBeforeCount = 0;

				for (let iteration = 0; iteration < 10; iteration++) {
					instance.isInvokeBeforeMethodCalled = false;
					assert.deepEqual(await instance[methodName](iteration), iteration);
					assert.isTrue(instance.isInvokeBeforeMethodCalled);
					assert.deepEqual(instance.invokedBeforeCount, iteration + 1);
				}
			};

			it("when invokeBefore method is sync", async () => {
				await assertIsCalled("method");
			});

			it("when invokeBefore method returns Promise", async () => {
				await assertIsCalled("methodPromisifiedInvokeBefore");
			});
		});

		describe("throws error in case the invokeBefore method throws", () => {
			const assertThrows = async (methodName: string): Promise<void> => {
				const instance: any = new InvokeBeforeDecoratorsTest();
				assert.isFalse(instance.isInvokeBeforeMethodCalled);
				const expectedResult = 1;
				await assert.isRejected(instance[methodName](expectedResult), expectedResult);
				assert.isTrue(instance.isInvokeBeforeMethodCalled);
			};

			it("when invokeBefore method is sync", async () => {
				await assertThrows("methodInvokeBeforeThrowing");
			});

			it("when invokeBefore method is sync", async () => {
				await assertThrows("methodPromisifiedInvokeBeforeThrowing");
			});
		});

		describe("passes correct args to invokeBefore method", () => {
			const assertIsCalled = async (methodName: string): Promise<void> => {
				const instance: any = new InvokeBeforeDecoratorsTest();
				assert.isFalse(instance.isInvokeBeforeMethodCalled);
				const expectedResult = 1;
				assert.deepEqual(await instance[methodName](expectedResult), expectedResult);
				assert.isTrue(instance.isInvokeBeforeMethodCalled);
				assert.deepEqual(instance.invokedBeforeArgument, "arg1");
			};

			it("when invokeBefore method is sync", async () => {
				await assertIsCalled("methodCallingInvokeBeforeWithArgs");
			});

			it("when invokeBefore method is sync", async () => {
				await assertIsCalled("methodPromisifiedInvokeBeforeWithArgs");
			});
		});
	});

	describe("performanceLog", () => {
		const testErrorMessage = "testError";
		let testInjector: IInjector;
		let sandbox: sinon.SinonSandbox;
		interface ITestInterface {
			testMethod(arg: any): any;
			throwMethod?(): void;
			testAsyncMehtod(arg: any): Promise<any>;
			rejectMethod?(): Promise<any>;
		}
		let testInstance: ITestInterface;
		let undecoratedTestInstance: ITestInterface;

		function createTestInjector(): IInjector {
			testInjector = new Yok();
			testInjector.register("performanceService", PerformanceService);
			testInjector.register("options", {});
			testInjector.register("fs", stubs.FileSystemStub);
			testInjector.register("logger", stubs.LoggerStub);
			testInjector.register("analyticsService", {
				trackEventActionInGoogleAnalytics: () => { return Promise.resolve(); }
			});

			return testInjector;
		}

		beforeEach(() => {
			sandbox = sinon.createSandbox();
			testInjector = createTestInjector();

			class TestClass implements ITestInterface {
				@decoratorsLib.performanceLog(testInjector)
				testMethod(arg: any) {
					return arg;
				}

				@decoratorsLib.performanceLog(testInjector)
				throwMethod() {
					throw new Error("testErrorMessage");
				}

				@decoratorsLib.performanceLog(testInjector)
				async testAsyncMehtod(arg: any) {
					return Promise.resolve(arg);
				}

				rejectMethod() {
					return Promise.reject(testErrorMessage);
				}
			}

			class UndecoratedTestClass implements ITestInterface {
				testMethod(arg: any) {
					return arg;
				}

				async testAsyncMehtod(arg: any) {
					return Promise.resolve(arg);
				}
			}

			undecoratedTestInstance = new UndecoratedTestClass();
			testInstance = new TestClass();
		});

		afterEach(() => {
			sandbox.restore();
		});

		_.each(expectedResults, (expectedResult: any) => {
			it("returns proper result", () => {
				const actualResult = testInstance.testMethod(expectedResult);
				assert.deepEqual(actualResult, expectedResult);
			});

			it("returns proper result when async", () => {
				const promise = testInstance.testAsyncMehtod(expectedResult);

				assert.notDeepEqual(promise.then, undefined);

				return promise.then((actualResult: any) => {
					assert.deepEqual(actualResult, expectedResult);
				});
			});
		});

		it("method has same toString", () => {
			assert.equal(testInstance.testMethod.toString(), undecoratedTestInstance.testMethod.toString());
		});

		it("method has same name", () => {
			assert.equal(testInstance.testMethod.name, undecoratedTestInstance.testMethod.name);
		});

		it("does not eat errors", () => {
			assert.throws(testInstance.throwMethod, testErrorMessage);
			assert.isRejected(testInstance.rejectMethod(), testErrorMessage);
		});

		it("calls performance service on method call", async () => {
			const performanceService = testInjector.resolve("performanceService");
			const processExecutionDataStub: sinon.SinonStub = sinon.stub(performanceService, "processExecutionData");

			const checkSubCall = (call: sinon.SinonSpyCall, methodData: string) => {
				const callArgs = call.args;
				const methodInfo = callArgs[0];
				const startTime = callArgs[1];
				const endTime = callArgs[2];

				assert(methodInfo === methodData);
				assert.isNumber(startTime);
				assert.isNumber(endTime);
				assert.isTrue(endTime > startTime);
				assert.isDefined(callArgs[3][0] === "test");
			};

			testInstance.testMethod("test");
			await testInstance.testAsyncMehtod("test");

			checkSubCall(processExecutionDataStub.firstCall, "TestClass__testMethod");
			checkSubCall(processExecutionDataStub.secondCall, "TestClass__testAsyncMehtod");
		});
	});

	describe("deprecated", () => {
		const testDepMessage = "Just stop using this!";
		const warnings: string[] = [];
		let testInjector: IInjector;
		interface ITestInterface {
			testField: string;
			testProp: string;
			depMethodWithParam(arg: any): any;
			depMethodWithoutParam(): void;
			depAsyncMethod(arg: any): Promise<any>;
			nonDepMethod(): any;
		}
		let testInstance: ITestInterface;

		function createTestInjector(): IInjector {
			testInjector = new Yok();
			testInjector.register("config", {});
			testInjector.register("options", {});
			testInjector.register("logger", {
				warn: (message: string) => {
					warnings.push(message);
				}
			});

			return testInjector;
		}

		beforeEach(() => {
			warnings.splice(0, warnings.length);
			testInjector = createTestInjector();

			class TestClass implements ITestInterface {
				public testField: string = "test";

				@decoratorsLib.deprecated(testDepMessage, testInjector)
				public get testProp(): string {
					return "hi";
				}

				public set testProp(value: string) {
					return;
				}

				@decoratorsLib.deprecated(testDepMessage, testInjector)
				depMethodWithParam(arg: any) {
					return arg;
				}

				@decoratorsLib.deprecated(testDepMessage, testInjector)
				depMethodWithoutParam() {
					return;
				}

				@decoratorsLib.deprecated(testDepMessage, testInjector)
				async depAsyncMethod(arg: any) {
					return Promise.resolve(arg);
				}

				nonDepMethod() {
					return;
				}
			}

			testInstance = new TestClass();
		});

		it("method without params", () => {
			testInstance.depMethodWithoutParam();
			assert.equal(warnings.length, 1);
			assert.equal(warnings[0], `depMethodWithoutParam is deprecated. ${testDepMessage}`);
		});

		it("method with params", () => {
			const param = 5;
			const result = testInstance.depMethodWithParam(param);
			assert.equal(result, param);
			assert.equal(warnings.length, 1);
			assert.equal(warnings[0], `depMethodWithParam is deprecated. ${testDepMessage}`);
		});

		it("async method with params", async () => {
			const param = 5;
			const result = await testInstance.depAsyncMethod(param);
			assert.equal(result, param);
			assert.equal(warnings.length, 1);
			assert.equal(warnings[0], `depAsyncMethod is deprecated. ${testDepMessage}`);
		});

		it("property getter", async () => {
			const result = testInstance.testProp;
			assert.equal(result, "hi");
			assert.equal(warnings.length, 1);
			assert.equal(warnings[0], `testProp is deprecated. ${testDepMessage}`);
		});

		it("property setter", async () => {
			testInstance.testProp = "newValue";
			assert.equal(warnings.length, 1);
			assert.equal(warnings[0], `testProp is deprecated. ${testDepMessage}`);
		});

		it("non deprecated field", async () => {
			const result = testInstance.testField;
			assert.equal(result, "test");
			assert.equal(warnings.length, 0);
		});

		it("non deprecated method", () => {
			testInstance.nonDepMethod();
			assert.equal(warnings.length, 0);
		});

		it("class", async () => {
			@decoratorsLib.deprecated(testDepMessage, testInjector)
			class TestClassDeprecated {
			}

			const depClass = new TestClassDeprecated();
			assert.isNotNull(depClass);
			assert.equal(warnings.length, 1);
			assert.equal(warnings[0], `TestClassDeprecated is deprecated. ${testDepMessage}`);
		});
	});
});
