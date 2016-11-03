declare module NativeScriptDoctor {
	export function getJavaVersion(): Promise<string>;
	export function getJavaCompilerVersion(): Promise<string>;
}

export = NativeScriptDoctor;
