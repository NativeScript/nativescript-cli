import { RequirementFunction } from "../..";
import { cocoaPodsRequirements } from "./cocoapods";
import { pythonRequirements } from "./python";
import { xcodeRequirements } from "./xcode";

export const iosRequirements: RequirementFunction[] = [
	...pythonRequirements,
	...xcodeRequirements,
	...cocoaPodsRequirements,
];
