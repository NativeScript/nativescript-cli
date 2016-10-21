/// <reference path="../lib/definitions/bluebird.d.ts" />

import * as Promise from "bluebird";

declare namespace NativeScriptDoctor {
	export function getJavaVersion(): Promise<string>;
	export function getJavaCompilerVersion(): Promise<string>;
}

export = NativeScriptDoctor;
