import * as xcode from "nativescript-dev-xcode";
import { $injector } from "../common/definitions/yok";

export { xcode };

$injector.register("xcode", xcode);
