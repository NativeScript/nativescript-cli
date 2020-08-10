import * as pbxprojDomXcodeModule from "pbxproj-dom/xcode";
import { $injector } from "../common/definitions/yok";

declare global {
	type IPbxprojDomXcode = typeof pbxprojDomXcodeModule;
}

$injector.register("pbxprojDomXcode", pbxprojDomXcodeModule);
