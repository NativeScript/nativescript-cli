import { InjectionToken } from "../common/di/injection-token";
// Type-only: this entry point must stay side-effect-free, and the token is an
// alias over the registration in lib/node/pbxproj-dom-xcode.ts, not a second
// loader.
import type * as pbxprojDomXcode from "pbxproj-dom/xcode";

/**
 * DOM-style reader/writer for Xcode project files.
 */
export const PBXPROJ_DOM_XCODE = new InjectionToken<typeof pbxprojDomXcode>(
	"pbxprojDomXcode",
);
