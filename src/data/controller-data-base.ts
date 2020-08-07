export class ControllerDataBase implements IControllerDataBase {
	public nativePrepare?: INativePrepare;

	constructor(public projectDir: string, public platform: string, data: any) {
		this.nativePrepare = data.nativePrepare;
	}
}
