

export class RequireService implements IRequireService {
	public require(module: string): any {
		return require(module);
	}
}

$injector.register("requireService", RequireService);
