import { IRequirementResult, ResultType } from "..";

export function result(
	type: ResultType,
	data: Omit<IRequirementResult, "type">
): IRequirementResult {
	return {
		type,
		...data,
	};
}

export function ok(message: string, details?: string) {
	return result(ResultType.OK, {
		message,
		details,
	});
}

export function error(message: string, details?: string) {
	return result(ResultType.ERROR, {
		message,
		details,
	});
}

export function warn(message: string, details?: string) {
	return result(ResultType.WARN, {
		message,
		details,
	});
}
