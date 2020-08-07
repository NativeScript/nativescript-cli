import * as pbxprojDomXcodeModule from "pbxproj-dom/xcode";


declare global {
	type IPbxprojDomXcode = typeof pbxprojDomXcodeModule;
}

$injector.register("pbxprojDomXcode", pbxprojDomXcodeModule);
