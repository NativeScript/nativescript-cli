export class InfoService implements IInfoService {
	constructor(private $versionsService: IVersionsService,
		private $logger: ILogger) { }

	public async printComponentsInfo(): Promise<void> {
		const allComponentsInfo = await this.$versionsService.getAllComponentsVersions();

		const table: any = this.$versionsService.createTableWithVersionsInformation(allComponentsInfo);

		this.$logger.out("All NativeScript components versions information");
		this.$logger.out(table.toString());
	}
}

$injector.register("infoService", InfoService);
