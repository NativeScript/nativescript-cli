import { InjectionToken } from "../common/di/injection-token";
// Type-only: this entry point must stay side-effect-free, and the token is an
// alias over the registration in lib/node/xcode.ts, not a second loader.
import type * as xcode from "nativescript-dev-xcode";

/**
 * Reads and edits `.pbxproj` files.
 */
export const XCODE = new InjectionToken<typeof xcode>("xcode");
