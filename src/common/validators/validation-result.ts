export class ValidationResult implements IValidationResult {
	public static Successful = new ValidationResult(null);

	constructor(private errorMsg: string) { }

	public get error(): string {
		return this.errorMsg;
	}

	public get isSuccessful(): boolean {
		return !this.errorMsg;
	}
}
