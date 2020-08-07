interface IValidationResult {
	error: string;
	isSuccessful: boolean;
}

interface IProjectNameValidator {
	validate(name: string): boolean;
}
