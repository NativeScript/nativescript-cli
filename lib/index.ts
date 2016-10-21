import * as Promise from "bluebird";
import { ChildProcess } from "./wrappers/child-process";
import { SysInfo } from "./sys-info";

let childProcess = new ChildProcess();
let sysInfo = new SysInfo(childProcess);

function getJavaVersion(): Promise<string> {
	return sysInfo.getJavaVersion();
};

function getJavaCompilerVersion(): Promise<string> {
	return sysInfo.getJavaCompilerVersion();
};

export {
	getJavaVersion,
	getJavaCompilerVersion
};
