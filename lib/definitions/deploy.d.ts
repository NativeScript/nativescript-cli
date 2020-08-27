interface IDeployController {
	deploy(data: IRunData): Promise<void>;
}
