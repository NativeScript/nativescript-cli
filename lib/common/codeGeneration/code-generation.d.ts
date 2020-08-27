import { IDictionary } from "../declarations";

declare module CodeGeneration {
	interface IModel {
		id: string;
		properties: IDictionary<IModelProperty>;
	}

	interface IModelProperty {
		type: string;
		items: IModelPropertyItems;
		allowableValues: IModelPropertyValue;
	}

	interface IModelPropertyItems {
		$ref: string;
	}

	interface IModelPropertyValue {
		valueType: string;
		values: string[];
	}

	interface ICodeEntity {
		opener?: string;
		codeEntityType: any;
	}

	interface ILine extends ICodeEntity {
		content: string;
	}

	interface IBlock extends ICodeEntity {
		opener: string;
		codeEntities: ICodeEntity[];
		writeLine(content: string): void;
		addLine(line: ILine): void;
		addBlock(block: IBlock): void;
		addBlocks(blocks: IBlock[]): void;
		endingCharacter?: string;
	}

	interface IService {
		serviceInterface: IBlock;
		serviceImplementation: IBlock;
	}
}
