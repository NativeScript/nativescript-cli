import { Yok } from "../../yok";
import { ProcessService } from "../../services/process-service";
import { assert } from "chai";

const processExitSignals = ["exit", "SIGINT", "SIGTERM"];
const emptyFunction = () => { /* no implementation required */ };
function createTestInjector(): IInjector {
	const testInjector = new Yok();

	testInjector.register("processService", ProcessService);

	return testInjector;
}

describe("Process service", () => {
	let testInjector: IInjector;
	let $processService: IProcessService;

	beforeEach(() => {
		testInjector = createTestInjector();
		$processService = testInjector.resolve("processService");
	});

	it("should not add only one listener for the exit, SIGIN and SIGTERM events.", () => {
		$processService.attachToProcessExitSignals({}, emptyFunction);
		$processService.attachToProcessExitSignals({}, emptyFunction);

		_.each(processExitSignals, (signal: string) => {
			// We need to search only for our listener because each exit signal have different listeners added to it.
			const actualListeners = _.filter(process.listeners(signal), (listener: Function) => listener.toString().indexOf("executeAllCallbacks") >= 0);
			assert.deepEqual(actualListeners.length, 1);
		});
	});

	it("should add listener with context only once if there already is callback with the same context.", () => {
		const context = { test: "test" };
		const listener = () => 42;

		$processService.attachToProcessExitSignals(context, listener);
		$processService.attachToProcessExitSignals(context, listener);

		assert.deepEqual($processService.listenersCount, 1);
	});

	it("should add two different listeners for one context.", () => {
		const context = { test: "test" };
		const numberListener = () => 42;
		const booleanListener = () => true;

		$processService.attachToProcessExitSignals(context, numberListener);
		$processService.attachToProcessExitSignals(context, booleanListener);

		assert.deepEqual($processService.listenersCount, 2);
	});

	it("should add one listener with different context twice.", () => {
		const listener = () => 42;

		$processService.attachToProcessExitSignals({}, listener);
		$processService.attachToProcessExitSignals({}, listener);

		assert.deepEqual($processService.listenersCount, 2);
	});

	it("should execute all attached listeners.", () => {
		let hasCalledFirstListener = false;
		let hasCalledSecondListener = false;
		let hasCalledThirdListener = false;

		const firstListener = () => {
			hasCalledFirstListener = true;
		};

		const secondListener = () => {
			hasCalledSecondListener = true;
		};

		const thirdListener = () => {
			hasCalledThirdListener = true;
		};

		$processService.attachToProcessExitSignals({}, firstListener);
		$processService.attachToProcessExitSignals({}, secondListener);
		$processService.attachToProcessExitSignals({}, thirdListener);

		// Do not use exit or SIGINT because the tests after this one will not be executed.
		global.process.emit("SIGTERM");

		assert.isTrue(hasCalledFirstListener);
		assert.isTrue(hasCalledSecondListener);
		assert.isTrue(hasCalledThirdListener);
	});
});
