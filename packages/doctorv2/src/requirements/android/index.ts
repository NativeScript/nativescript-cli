import { RequirementFunction } from "../..";

import { androidSdkRequirements } from "./android-sdk";
import { javaRequirements } from "./java";

export const androidRequirements: RequirementFunction[] = [
	...androidSdkRequirements,
	...javaRequirements,
];
