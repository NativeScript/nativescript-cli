/// <reference path="./interfaces.ts" />


declare module "nativescript-doctor" {
	export const doctor: NativeScriptDoctor.IDoctor;
	export const sysInfo: NativeScriptDoctor.ISysInfo;
	export const constants: NativeScriptDoctor.IConstants;
}
