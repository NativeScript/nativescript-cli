import { EOL } from "os";
import { CodeEntityType } from "./code-entity";

export class CodePrinter {
	private static INDENT_CHAR = "\t";
	private static NEW_LINE_CHAR = EOL;
	private static START_BLOCK_CHAR = " {";
	private static END_BLOCK_CHAR = "}";

	public composeBlock(block: CodeGeneration.IBlock, indentSize?: number): string {
		indentSize = indentSize === undefined ? 0 : indentSize;
		let content = this.getIndentation(indentSize);

		if (block.opener) {
			content += block.opener;
			content += CodePrinter.START_BLOCK_CHAR;
			content += CodePrinter.NEW_LINE_CHAR;
		}

		_.each(block.codeEntities, (codeEntity: CodeGeneration.ICodeEntity) => {
			if (codeEntity.codeEntityType === CodeEntityType.Line) {
				content += this.composeLine(<CodeGeneration.ILine>codeEntity, indentSize + 1);
			} else if (codeEntity.codeEntityType === CodeEntityType.Block) {
				content += this.composeBlock(<CodeGeneration.IBlock>codeEntity, indentSize + 1);
			}
		});

		if (block.opener) {
			content += this.getIndentation(indentSize);
			content += CodePrinter.END_BLOCK_CHAR;
			content += block.endingCharacter || '';
			content += CodePrinter.NEW_LINE_CHAR;
		}

		return content;
	}

	private getIndentation(indentSize: number): string {
		return Array(indentSize).join(CodePrinter.INDENT_CHAR);
	}

	private composeLine(line: CodeGeneration.ILine, indentSize: number): string {
		let content = this.getIndentation(indentSize);
		content += line.content;
		content += CodePrinter.NEW_LINE_CHAR;

		return content;
	}
}
$injector.register("swaggerCodePrinter", CodePrinter);
