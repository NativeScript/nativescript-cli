import { INativePrepare } from "./project";

interface IControllerDataBase {
	projectDir: string;
	platform: string;
	nativePrepare?: INativePrepare;
}
