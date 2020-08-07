import { invokeBefore } from "../../../decorators";

export class InvokeBeforeDecoratorsTest {
	public counter = 0;

	public isInvokeBeforeMethodCalled = false;
	public invokedBeforeArgument: any;
	public invokedBeforeCount = 0;

	public invokedBeforeMethod(arg1: any): any {
		this.invokedBeforeCount++;
		this.invokedBeforeArgument = arg1;
		this.isInvokeBeforeMethodCalled = true;
	}

	public async promisifiedInvokedBeforeMethod(arg1: any): Promise<any> {
		this.invokedBeforeCount++;
		this.invokedBeforeArgument = arg1;
		this.isInvokeBeforeMethodCalled = true;
	}

	public invokedBeforeThrowingMethod(arg1: any): any {
		this.invokedBeforeCount++;
		this.invokedBeforeArgument = arg1;
		this.isInvokeBeforeMethodCalled = true;

		throw new Error(arg1);
	}

	public async promisifiedInvokedBeforeThrowingMethod(arg1: any): Promise<any> {
		this.invokedBeforeCount++;
		this.invokedBeforeArgument = arg1;
		this.isInvokeBeforeMethodCalled = true;

		throw new Error(arg1);
	}

	@invokeBefore("invokedBeforeMethod")
	public async method(num: number): Promise<number> {
		this.counter++;
		return num;
	}

	@invokeBefore("promisifiedInvokedBeforeMethod")
	public async methodPromisifiedInvokeBefore(num: number): Promise<number> {
		this.counter++;
		return num;
	}

	@invokeBefore("invokedBeforeThrowingMethod")
	public async methodInvokeBeforeThrowing(num: number): Promise<number> {
		this.counter++;
		return num;
	}

	@invokeBefore("promisifiedInvokedBeforeThrowingMethod")
	public async methodPromisifiedInvokeBeforeThrowing(num: number): Promise<number> {
		this.counter++;
		return num;
	}

	@invokeBefore("invokedBeforeMethod", ["arg1"])
	public async methodCallingInvokeBeforeWithArgs(num: number): Promise<number> {
		this.counter++;
		return num;
	}

	@invokeBefore("promisifiedInvokedBeforeMethod", ["arg1"])
	public async methodPromisifiedInvokeBeforeWithArgs(num: number): Promise<number> {
		this.counter++;
		return num;
	}
}
