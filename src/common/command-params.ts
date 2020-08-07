import { ICommandParameter, IStringParameterBuilder } from "./definitions/commands";

export class StringCommandParameter implements ICommandParameter {
	public mandatory = false;
	public errorMessage: string;

	public async validate(validationValue: string): Promise<boolean> {
		if (!validationValue) {
			if (this.errorMessage) {
				$injector.resolve("errors").fail(this.errorMessage);
			}

			return false;
		}

		return true;
	}
}
$injector.register("stringParameter", StringCommandParameter);

export class StringParameterBuilder implements IStringParameterBuilder {

	public createMandatoryParameter(errorMsg: string): ICommandParameter {
		const commandParameter = new StringCommandParameter();
		commandParameter.mandatory = true;
		commandParameter.errorMessage = errorMsg;

		return commandParameter;
	}
}
$injector.register("stringParameterBuilder", StringParameterBuilder);
