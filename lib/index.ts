import { ChildProcess } from "./wrappers/child-process";
import { SysInfo } from "./sys-info";

const childProcess = new ChildProcess();
const sysInfo = new SysInfo(childProcess);

const getJavaVersion = (): Promise<string> => {
	return sysInfo.getJavaVersion();
};

const getJavaCompilerVersion = (): Promise<string> => {
	return sysInfo.getJavaCompilerVersion();
};

export {
	getJavaVersion,
	getJavaCompilerVersion
};
