export enum CodeEntityType {
	Line,
	Block
}

export class Line implements CodeGeneration.ILine {
	public content: string;

	constructor(content: string) {
		this.content = content;
	}

	public get codeEntityType() {
		return CodeEntityType.Line;
	}

	public static create(content: string): CodeGeneration.ILine {
		return new Line(content);
	}
}
$injector.register("swaggerLine", Line);

export class Block implements CodeGeneration.IBlock {
	public opener: string;
	public codeEntities: CodeGeneration.ICodeEntity[];
	public endingCharacter: string;

	constructor(opener?: string) {
		this.opener = opener;
		this.codeEntities = [];
	}

	public get codeEntityType() {
		return CodeEntityType.Block;
	}

	public addBlock(block: CodeGeneration.IBlock): void {
		this.codeEntities.push(block);
	}

	public addLine(line: CodeGeneration.ILine): void {
		this.codeEntities.push(line);
	}

	public addBlocks(blocks: CodeGeneration.IBlock[]): void {
		_.each(blocks, (block: CodeGeneration.IBlock) => this.addBlock(block));
	}

	public writeLine(content: string): void {
		const line = Line.create(content);
		this.codeEntities.push(line);
	}
}
$injector.register("swaggerBlock", Block);
