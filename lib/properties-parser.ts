///<reference path=".d.ts"/>

import propertiesParser = require("properties-parser");
import Future = require("fibers/future");

export class PropertiesParser implements IPropertiesParser {
	public createEditor(filePath: string) {
		var future = new Future<any>();
		propertiesParser.createEditor(filePath,  (err, data) => {
			if(err) {
				future.throw(err);
			} else {
				future.return(data);
			}
		});

		return future;
	}
}
$injector.register("propertiesParser", PropertiesParser);