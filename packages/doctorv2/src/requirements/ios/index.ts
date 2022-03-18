import { cocoaPodsRequirements } from "./cocoapods";
import { pythonRequirements } from "./python";
import { RequirementFunction } from "../..";
import { xcodeRequirements } from "./xcode";

export const iosRequirements: RequirementFunction[] = [
	...pythonRequirements,
	...xcodeRequirements,
	...cocoaPodsRequirements,
];
