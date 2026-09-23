interface IDeployController {
	deploy(data: IDeployData): Promise<void>;
}
