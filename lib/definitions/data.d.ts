interface IControllerDataBase {
	projectDir: string;
	platform: string;
	nativePrepare?: INativePrepare;
	nsconfig?: boolean;
}