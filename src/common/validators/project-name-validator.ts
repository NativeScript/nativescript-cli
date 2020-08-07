import * as path from "path";
import * as helpers from "../helpers";
import * as ValidationResult from "./validation-result";

export class ProjectNameValidator implements IProjectNameValidator {
	private static MAX_FILENAME_LENGTH = 30;
	private static EMPTY_FILENAME_ERROR_MESSAGE = "Name cannot be empty.";
	private static NOT_VALID_NAME_ERROR_MESSAGE = "Name should contain only the following symbols: A-Z, a-z, 0-9, _, ., - and space";
	private static RESERVED_NAME_ERROR_MESSAGE = "Name is among the reserved names: ~, CON, PRN, AUX, NUL, COM1, COM2, COM3, COM4, COM5, COM6, COM7, COM8, COM9, LPT1, LPT2, LPT3, LPT4, LPT5, LPT6, LPT7, LPT8, and LPT9.";
	private static INVALID_EXTENSION_ERROR_MESSAGE = "Unsupported file type.";
	private static TOO_LONG_NAME_ERROR_MESSAGE = "Name is too long.";
	private static TRAILING_DOTS_ERROR_MESSAGE = "Name cannot contain trailing dots.";
	private static LEADING_SPACES_ERROR_MESSAGE = "Name cannot contain leading spaces.";
	private static TRAILING_SPACES_ERROR_MESSAGE = "Name cannot contain trailing spaces.";
	private static INVALID_FILENAMES = ["~", "CON", "PRN", "AUX", "NUL", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"];
	private static INVALID_EXTENSIONS: string[] = [];

	constructor(private $errors: IErrors) { }

	private validateName(name: string): ValidationResult.ValidationResult {
		const validNameRegex = /^[a-zA-Z0-9_.\- ]*$/g;
		const ext = path.extname(name);

		if (helpers.isNullOrWhitespace(name)) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.EMPTY_FILENAME_ERROR_MESSAGE);
		}
		if (!validNameRegex.test(name)) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.NOT_VALID_NAME_ERROR_MESSAGE);
		}
		if (_.includes(ProjectNameValidator.INVALID_FILENAMES, name.split(".")[0])) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.RESERVED_NAME_ERROR_MESSAGE);
		}
		if (ext !== "" && _.includes(ProjectNameValidator.INVALID_EXTENSIONS, ext)) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.INVALID_EXTENSION_ERROR_MESSAGE);
		}
		if (name.length > ProjectNameValidator.MAX_FILENAME_LENGTH) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.TOO_LONG_NAME_ERROR_MESSAGE);
		}
		if (_.startsWith(name, " ")) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.LEADING_SPACES_ERROR_MESSAGE);
		}
		if (_.endsWith(name, ".")) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.TRAILING_DOTS_ERROR_MESSAGE);
		}
		if (_.endsWith(name, " ")) {
			return new ValidationResult.ValidationResult(ProjectNameValidator.TRAILING_SPACES_ERROR_MESSAGE);
		}

		return ValidationResult.ValidationResult.Successful;
	}

	public validate(name: string): boolean {
		const validationResult: ValidationResult.ValidationResult = this.validateName(name);
		const isSuccessful = validationResult.isSuccessful;

		if (!isSuccessful) {
			this.$errors.fail(validationResult.error);
		}

		return isSuccessful;
	}
}
$injector.register("projectNameValidator", ProjectNameValidator);
