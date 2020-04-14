export class ControllerDataBase implements IControllerDataBase {
	public nativePrepare?: INativePrepare;
	public nsconfig?: boolean;

	constructor(public projectDir: string, public platform: string, data: any) {
		this.nativePrepare = data.nativePrepare;
		this.nsconfig = data.nsconfig;
	}
}
