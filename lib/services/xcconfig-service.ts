export class XCConfigService {
	constructor(private $fs: IFileSystem) {
	}

	/**
	 * Returns the Value of a Property from a XC Config file.
	 * @param xcconfigFilePath 
	 * @param propertyName
	 */
	public readPropertyValue(xcconfigFilePath: string, propertyName: string): string {
		if (this.$fs.exists(xcconfigFilePath)) {
			let text = this.$fs.readText(xcconfigFilePath);

			let property: string;
			text.split(/\r?\n/).forEach((line) => {
				line = line.replace(/\/(\/)[^\n]*$/, "");
				if (line.indexOf(propertyName) >= 0) {
					// todo this can have undefined.
					property = line.split("=")[1].trim();
					// todo this can have undefined.
					if (property[property.length - 1] === ';') {
						property = property.slice(0, -1);
					}
				}
			});

			// what if the property is set to empty value?
			if (property) {
				return property;
			}
		}

		return null;
	}
}

$injector.register("xCConfigService", XCConfigService);
