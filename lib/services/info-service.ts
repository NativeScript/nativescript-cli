export class InfoService implements IInfoService {
	constructor(private $versionsService: IVersionsService,
		private $logger: ILogger) { }

	public printComponentsInfo(): IFuture<void> {
		return (() => {
			let allComponentsInfo = this.$versionsService.getAllComponentsVersions().wait();

			let table: any = this.$versionsService.createTableWithVersionsInformation(allComponentsInfo);

			this.$logger.out("All NativeScript components versions information");
			this.$logger.out(table.toString());
		}).future<void>()();
	}
}

$injector.register("infoService", InfoService);
