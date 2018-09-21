import * as helpers from "../../helpers";
import { assert } from "chai";
import { EOL } from "os";

interface ITestData {
	input: any;
	expectedResult: any;
	expectedError?: any;
}

describe("helpers", () => {

	const assertTestData = (testData: ITestData, method: Function) => {
		const actualResult = method(testData.input);
		assert.deepEqual(actualResult, testData.expectedResult, `For input ${testData.input}, the expected result is: ${testData.expectedResult}, but actual result is: ${actualResult}.`);
	};

	describe("appendZeroesToVersion", () => {
		interface IAppendZeroesToVersionTestData extends ITestData {
			requiredVersionLength: number;
		}

		const testData: IAppendZeroesToVersionTestData[] = [
			{
				input: "3.0.0",
				requiredVersionLength: 3,
				expectedResult: "3.0.0"
			},
			{
				input: "3.0",
				requiredVersionLength: 3,
				expectedResult: "3.0.0"
			},
			{
				input: "3",
				requiredVersionLength: 3,
				expectedResult: "3.0.0"
			},
			{
				input: "1.8.0_152",
				requiredVersionLength: 3,
				expectedResult: "1.8.0_152"
			},
			{
				input: "",
				requiredVersionLength: 3,
				expectedResult: ""
			},
			{
				input: null,
				requiredVersionLength: 3,
				expectedResult: null
			},
			{
				input: undefined,
				requiredVersionLength: 3,
				expectedResult: undefined
			},
			{
				input: "1",
				requiredVersionLength: 5,
				expectedResult: "1.0.0.0.0"
			},
		];

		it("appends correct number of zeroes", () => {
			_.each(testData, testCase => {
				assert.deepEqual(helpers.appendZeroesToVersion(testCase.input, testCase.requiredVersionLength), testCase.expectedResult);
			});
		});
	});

	describe("executeActionByChunks", () => {
		const chunkSize = 2;

		const assertElements = (initialDataValues: any[], handledElements: any[], element: any, passedChunkSize: number) => {
			return new Promise(resolve => setImmediate(() => {
				const remainingElements = _.difference(initialDataValues, handledElements);
				const isFromLastChunk = (element + passedChunkSize) > initialDataValues.length;
				// If the element is one of the last chunk, the remainingElements must be empty.
				// If the element is from any other chunk, the remainingElements must contain all elements outside of this chunk.
				if (isFromLastChunk) {
					assert.isTrue(!remainingElements.length);
				} else {
					const indexOfElement = initialDataValues.indexOf(element);
					const chunkNumber = Math.floor(indexOfElement / passedChunkSize) + 1;
					const expectedRemainingElements = _.drop(initialDataValues, chunkNumber * passedChunkSize);

					assert.deepEqual(remainingElements, expectedRemainingElements);
				}

				resolve();
			}));
		};

		it("works correctly with array", () => {
			const initialData = _.range(7);
			const handledElements: number[] = [];

			return helpers.executeActionByChunks(initialData, chunkSize, (element: number, index: number) => {
				handledElements.push(element);
				assert.deepEqual(element, initialData[index]);
				assert.isTrue(initialData.indexOf(element) !== -1);
				return assertElements(initialData, handledElements, element, chunkSize);
			});
		});

		it("works correctly with IDictionary", () => {
			const initialData: IDictionary<any> = {
				a: 1,
				b: 2,
				c: 3,
				d: 4,
				e: 5,
				f: 6
			};

			const initialDataValues = _.values(initialData);
			const handledElements: number[] = [];
			return helpers.executeActionByChunks(initialData, chunkSize, (element, key) => {
				handledElements.push(element);
				assert.isTrue(initialData[key] === element);
				return assertElements(initialDataValues, handledElements, element, chunkSize);
			});
		});
	});

	describe("getPropertyName", () => {
		const ES5Functions: ITestData[] = [
			{
				input: `function (a) {
					return a.test;
				}`,
				expectedResult: "test"
			},
			{
				input: `function(a) {return a.test;}`,
				expectedResult: "test"
			},
			{
				input: null,
				expectedResult: null
			},
			{
				input: "",
				expectedResult: null
			},
			{
				// Not supported scenario.
				// Argument of the function must be object and the function must return one of its properties.
				input: "function(a){ return a; }",
				expectedResult: null
			},
			{
				input: `function(a) {return a.b.test;}`,
				expectedResult: "test"
			},
			{
				input: `function(a) {return a.b.c.d.["test1"].e.f.test;}`,
				expectedResult: "test"
			},
			{
				input: `function(a) {return ;}`,
				expectedResult: null
			},
			{
				input: `function(a) {return undefined;}`,
				expectedResult: null
			},
			{
				input: `function(a) {return null;}`,
				expectedResult: null
			},
			{
				input: `function(a) {return "test";}`,
				expectedResult: null
			}
		];

		const ES6Functions: ITestData[] = [
			{
				input: `(a) => {
					return a.test;
				}`,
				expectedResult: "test"
			},
			{
				input: `(a)=>{return a.test;}`,
				expectedResult: "test"
			},
			{
				input: `a => a.test`,
				expectedResult: "test"
			},
			{
				input: `(a) => a.test`,
				expectedResult: "test"
			},
			{
				input: `(a)     =>    a.test      `,
				expectedResult: "test"
			},
			{
				input: `(a)=>a.test       `,
				expectedResult: "test"
			},
			{
				input: null,
				expectedResult: null
			},
			{
				input: "",
				expectedResult: null
			},
			{
				// Not supported scenario.
				// Argument of the function must be object and the function must return one of its properties.
				input: "a => a",
				expectedResult: null
			},
			{
				input: `(a) => a.b.test`,
				expectedResult: "test"
			},
			{
				input: `(a) => { return a.b.test; }`,
				expectedResult: "test"
			},
			{
				input: `a => a.b.c.d.["test1"].e.f.test`,
				expectedResult: "test"
			},
			{
				input: `(a) => {return ;}`,
				expectedResult: null
			},
			{
				input: `a => undefined `,
				expectedResult: null
			},
			{
				input: `a => null`,
				expectedResult: null
			},
			{
				input: `a => "test"`,
				expectedResult: null
			},
			{
				input: (a: any) => a.test,
				expectedResult: "test"
			}
		];

		// getPropertyName accepts function as argument.
		// The tests will use strings in order to skip transpilation of lambdas to functions.
		it("returns correct property name for ES5 functions", () => {
			_.each(ES5Functions, testData => assertTestData(testData, helpers.getPropertyName));
		});

		it("returns correct property name for ES6 functions", () => {
			_.each(ES6Functions, testData => assertTestData(testData, helpers.getPropertyName));
		});
	});

	describe("toBoolean", () => {
		const toBooleanTestData: ITestData[] = [
			{
				input: true,
				expectedResult: true
			},
			{
				input: false,
				expectedResult: false
			},
			{
				input: "true",
				expectedResult: true
			},
			{
				input: "false",
				expectedResult: false
			},
			{
				input: "",
				expectedResult: false
			},
			{
				input: null,
				expectedResult: false
			},
			{
				input: undefined,
				expectedResult: false
			},
			{
				input: '\n',
				expectedResult: false
			},
			{
				input: '\r\n',
				expectedResult: false
			},
			{
				input: '\t',
				expectedResult: false
			},
			{
				input: '\t\t\t\t\t\t\n\t\t\t\t\r\n\r\n\n\n   \t\t\t\r\n',
				expectedResult: false
			},
			{
				input: "some random text",
				expectedResult: false
			},
			{
				input: { "true": true },
				expectedResult: false
			},
			{
				input: {},
				expectedResult: false
			},
			{
				input: { "a": { "b": 1 } },
				expectedResult: false
			}
		];

		it("returns expected result", () => {
			_.each(toBooleanTestData, testData => assertTestData(testData, helpers.toBoolean));
		});

		it("returns false when Object.create(null) is passed", () => {
			const actualResult = helpers.toBoolean(Object.create(null));
			assert.deepEqual(actualResult, false);
		});
	});

	describe("isNullOrWhitespace", () => {
		const isNullOrWhitespaceTestData: ITestData[] = [
			{
				input: "",
				expectedResult: true
			},
			{
				input: "     ",
				expectedResult: true
			},
			{
				input: null,
				expectedResult: true
			},
			{
				input: undefined,
				expectedResult: true
			},
			{
				input: [],
				expectedResult: false
			},
			{
				input: ["test1", "test2"],
				expectedResult: false
			},
			{
				input: {},
				expectedResult: false
			},
			{
				input: { a: 1, b: 2 },
				expectedResult: false
			},
			{
				input: true,
				expectedResult: false
			},
			{
				input: false,
				expectedResult: false
			},
			{
				input: '\n',
				expectedResult: true
			},
			{
				input: '\r\n',
				expectedResult: true
			},
			{
				input: '\t',
				expectedResult: true
			},
			{
				input: '\t\t\t\t\t\t\r\n\t\t\t\t\t\n\t\t\t     \t\t\t\t\t\n\r\n   ',
				expectedResult: true
			}
		];

		it("returns expected result", () => {
			_.each(isNullOrWhitespaceTestData, t => assertTestData(t, helpers.isNullOrWhitespace));
		});

		it("returns false when Object.create(null) is passed", () => {
			const actualResult = helpers.isNullOrWhitespace(Object.create(null));
			assert.deepEqual(actualResult, false);
		});
	});

	describe("settlePromises<T>", () => {
		const getErrorMessage = (messages: any[]): string => {
			return `Multiple errors were thrown:${EOL}${messages.join(EOL)}`;
		};

		const getRejectedPromise = (errorMessage: any): Promise<any> => {
			const promise = Promise.reject(errorMessage);
			promise.catch(() => {
				// the handler is here in order to prevent warnings in Node 7+
				// PromiseRejectionHandledWarning: Promise rejection was handled asynchronously
				// Check the link for more details: https://stackoverflow.com/questions/40920179/should-i-refrain-from-handling-promise-rejection-asynchronously/40921505
			});

			return promise;
		};

		const settlePromisesTestData: ITestData[] = [
			{
				input: [Promise.resolve(1)],
				expectedResult: [1]
			},
			{
				input: [Promise.resolve(1), Promise.resolve(2)],
				expectedResult: [1, 2]
			},
			{
				input: [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3), Promise.resolve(4), Promise.resolve(5)],
				expectedResult: [1, 2, 3, 4, 5]
			},
			{
				input: [Promise.resolve(1), getRejectedPromise(2)],
				expectedResult: null,
				expectedError: getErrorMessage([2])
			},
			{
				input: [getRejectedPromise(1), Promise.resolve(2)],
				expectedResult: null,
				expectedError: getErrorMessage([1])
			},
			{
				input: [Promise.resolve(1), getRejectedPromise(2), Promise.resolve(3), getRejectedPromise(new Error("4"))],
				expectedResult: null,
				expectedError: getErrorMessage([2, 4])
			},
			{
				input: [Promise.resolve(1), new Promise(resolve => setTimeout(() => resolve(2), 10)), Promise.resolve(3), Promise.resolve(4), Promise.resolve(5)],
				expectedResult: [1, 2, 3, 4, 5]
			}
		];

		_.each(settlePromisesTestData, (testData, inputNumber) => {
			it(`returns correct data, test case ${inputNumber}`, (done: any) => {
				helpers.settlePromises<any>(testData.input)
					.then(res => {
						assert.deepEqual(res, testData.expectedResult);
					})
					.catch(err => {
						assert.deepEqual(err.message, testData.expectedError);
					})
					.then(done)
					.catch(done);
			});
		});

		it("executes all promises even when some of them are rejected", (done: mocha.Done) => {
			let isPromiseSettled = false;

			const testData: ITestData = {
				input: [getRejectedPromise(1), Promise.resolve(2).then(() => isPromiseSettled = true)],
				expectedResult: null,
				expectedError: getErrorMessage([1])
			};

			helpers.settlePromises<any>(testData.input)
				.then(res => {
					assert.deepEqual(res, testData.expectedResult);
				}, err => {
					assert.deepEqual(err.message, testData.expectedError);
				})
				.then(() => {
					assert.isTrue(isPromiseSettled, "When the first promise is rejected, the second one should still be executed.");
					done();
				})
				.catch(done);
		});
	});

	describe("getPidFromiOSSimulatorLogs", () => {
		interface IiOSSimulatorPidTestData extends ITestData {
			appId?: string;
		}

		const appId = "abc.def.ghi";
		const pid = "12345";

		const assertPidTestData = (testData: IiOSSimulatorPidTestData) => {
			const actualResult = helpers.getPidFromiOSSimulatorLogs(testData.appId || appId, testData.input);
			assert.deepEqual(actualResult, testData.expectedResult, `For input ${testData.input}, the expected result is: ${testData.expectedResult}, but actual result is: ${actualResult}.`);
		};

		const getPidFromiOSSimulatorLogsTestData: IiOSSimulatorPidTestData[] = [
			{
				// Real log lines that contain the PID are in this format
				input: `${appId}: ${appId}: ${pid}`,
				expectedResult: pid
			},
			{
				input: `${appId}: ${appId}:          ${pid}`,
				expectedResult: null
			},
			{
				input: `${appId}: ${appId}:${pid}`,
				expectedResult: pid
			},
			{
				input: `${appId}: ${appId}: ${pid} some other data`,
				expectedResult: pid
			},
			{
				input: `${appId}: ${appId}: ${pid} some other data ending with numbers 123`,
				expectedResult: pid
			},
			{
				input: `${appId}: ${pid}`,
				expectedResult: pid
			},
			{
				input: `some not valid app id with: ${pid}`,
				expectedResult: null
			},
			{
				input: null,
				expectedResult: null
			},
			{
				input: undefined,
				expectedResult: null
			},
			{
				input: '',
				expectedResult: null
			},
			{
				input: '        ',
				expectedResult: null
			},
			{
				input: '',
				expectedResult: null
			},
			{
				input: `${appId}: ${appId}\n: ${pid}`,
				expectedResult: null
			},
			{
				input: `org.nativescript.app123456: org.nativescript.app123456: ${pid}`,
				appId: "org.nativescript.app123456",
				expectedResult: pid
			}
		];

		it("returns expected result", () => {
			_.each(getPidFromiOSSimulatorLogsTestData, testData => assertPidTestData(testData));
		});
	});

	describe("getValueFromNestedObject", () => {
		interface IValueFromNestedObjectTestData extends ITestData {
			key: string;
		}

		const key = "key";
		const dollarKey = "$key";
		const dollarTestObj = { [dollarKey]: "value" };
		const serviceKey = "keyEndingWithService";
		const serviceTestObj = { [serviceKey]: "value" };
		const testObj = { key };
		const getValueFromNestedObjectTestData: IValueFromNestedObjectTestData[] = [
			{
				key,
				input: {},
				expectedResult: undefined
			},
			{
				key,
				input: testObj,
				expectedResult: testObj
			},
			{
				key,
				input: { nestedKey: testObj },
				expectedResult: testObj
			},
			{
				key,
				input: { nestedKey: { anotherNestedKey: testObj } },
				expectedResult: testObj
			},
			{
				key,
				input: { otherKey: "otherValue" },
				expectedResult: undefined
			},
			{
				key,
				input: { otherKey: "otherValue" },
				expectedResult: undefined
			},
			{
				key: dollarKey,
				input: dollarTestObj,
				expectedResult: dollarTestObj
			},
			{
				key: dollarKey,
				input: { nestedKey: dollarTestObj },
				expectedResult: dollarTestObj
			},
			{
				key: dollarKey,
				input: { "$nestedKey": dollarTestObj },
				expectedResult: undefined
			},
			{
				key: serviceKey,
				input: serviceTestObj,
				expectedResult: serviceTestObj
			},
			{
				key: serviceKey,
				input: { nestedKey: serviceTestObj },
				expectedResult: serviceTestObj
			},
			{
				key: serviceKey,
				input: { nestedKeyService: serviceTestObj },
				expectedResult: undefined
			}
		];

		const assertValueFromNestedObjectTestData = (testData: IValueFromNestedObjectTestData) => {
			const actualResult = helpers.getValueFromNestedObject(testData.input, testData.key);
			assert.deepEqual(actualResult, testData.expectedResult, `For input ${JSON.stringify(testData.input)}, the expected result is: ${JSON.stringify(testData.expectedResult || "undefined")}, but actual result is: ${JSON.stringify(actualResult || "undefined")}.`);
		};

		it("returns expected result", () => {
			_.each(getValueFromNestedObjectTestData, testData => assertValueFromNestedObjectTestData(testData));
		});
	});

	describe("isNumberWithoutExponent", () => {
		const testData: ITestData[] = [
			{
				input: 42,
				expectedResult: true
			},
			{
				input: "42",
				expectedResult: true
			},
			{
				input: null,
				expectedResult: false
			},
			{
				input: undefined,
				expectedResult: false
			},
			{
				input: {},
				expectedResult: false
			},
			{
				input: "some text",
				expectedResult: false
			},
			{
				input: "1e7",
				expectedResult: false
			},
			{
				input: "3.14",
				expectedResult: true
			}
		];

		it("returns correct result", () => {
			_.each(testData, testCase => {
				assert.deepEqual(helpers.isNumberWithoutExponent(testCase.input), testCase.expectedResult);
			});
		});
	});
});
