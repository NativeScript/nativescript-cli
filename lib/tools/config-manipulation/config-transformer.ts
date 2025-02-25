import {
	BooleanLiteral,
	ExportAssignment,
	ExpressionStatement,
	Identifier,
	Node,
	NumericLiteral,
	ObjectLiteralElementLike,
	ObjectLiteralExpression,
	Project,
	PropertyAccessExpression,
	PropertyAssignment,
	ScriptKind,
	ShorthandPropertyAssignment,
	SourceFile,
	StringLiteral,
	SyntaxKind,
} from "ts-morph";

export type SupportedConfigValues =
	| string
	| number
	| boolean
	| { [key: string]: SupportedConfigValues }
	| any[];

export interface IConfigTransformer {
	/**
	 * Sets or updates the value at `path` and returns the updated content
	 * @param {string} path path to the property, supports dot notation.
	 * @param {SupportedConfigValues} value the value to set at `path`.
	 * @returns {string} the updated content
	 */
	setValue(path: string, value: SupportedConfigValues): string;
}

export class ConfigTransformer implements IConfigTransformer {
	private project: Project;
	private config: SourceFile;
	private readonly scriptKind: ScriptKind;

	constructor(content: string) {
		this.project = new Project({
			compilerOptions: {
				allowJs: true,
			},
		});
		this.scriptKind = content.includes("module.exports")
			? ScriptKind.JS
			: ScriptKind.TS;
		this.config = this.project.createSourceFile(
			"virtual_nativescript.config.ts",
			content,
			{
				scriptKind: this.scriptKind,
			},
		);
	}

	private getDefaultExportValue(): ObjectLiteralExpression {
		let exportValue;
		if (this.scriptKind === ScriptKind.JS) {
			this.config.getStatements().find((statement: any) => {
				try {
					if (statement.getKind() === SyntaxKind.ExpressionStatement) {
						const expression = (
							statement as ExpressionStatement
						).getExpressionIfKind(SyntaxKind.BinaryExpression);
						const leftSide = expression.getLeft() as PropertyAccessExpression;
						if (leftSide.getFullText().trim() === "module.exports") {
							exportValue = expression.getRight();
							return true;
						}
					}
				} catch (err) {
					return false;
				}
			});
		} else {
			const exports = this.config
				.getDefaultExportSymbolOrThrow()
				.getDeclarations()[0] as ExportAssignment;
			const expr = exports.getExpression();
			exportValue =
				expr.getChildCount() > 0
					? (expr.getChildAtIndex(0) as ObjectLiteralExpression)
					: expr;
		}

		if (!Node.isObjectLiteralExpression(exportValue)) {
			throw new Error("default export must be an object!");
		}

		return exportValue;
	}

	private getProperty(
		key: string,
		parent: ObjectLiteralExpression = null,
	): ObjectLiteralElementLike {
		if (key.includes(".")) {
			const parts = key.split(".");
			const name = parts.shift();
			const property = this.getProperty(name, parent);

			// no android key, add it to parent to root
			if (!property) {
				return undefined;
			}

			const _parent: any = property.getLastChild((child: any) => {
				return Node.isObjectLiteralExpression(child);
			}) as ObjectLiteralExpression;

			if (!_parent) {
				return undefined;
			}

			// add nonExistent.deep to android: {}
			return this.getProperty(parts.join("."), _parent);
		}

		// if we have a parent, we are reading the property from it
		if (parent) {
			return parent.getProperty(key);
		}

		// otherwise we just read it from the root exports object
		return this.getProperty(key, this.getDefaultExportValue());
	}

	private addProperty(
		key: string,
		value: SupportedConfigValues | {},
		parent: ObjectLiteralExpression = null,
	): any {
		if (key.includes(".")) {
			const parts = key.split(".");
			const name = parts.shift();
			let property = this.getProperty(name, parent);

			if (!property) {
				property = this.addProperty(
					name,
					{},
					parent || this.getDefaultExportValue(),
				);
			}

			const _parent: any = property.getLastChild((child: any) => {
				return Node.isObjectLiteralExpression(child);
			}) as ObjectLiteralExpression;

			if (!_parent) {
				throw new Error(`Could not add property '${parts[0]}'.`);
			}

			return this.addProperty(parts.join("."), value, _parent);
		}

		if (parent) {
			return parent.addPropertyAssignment({
				name: key,
				initializer: this.createInitializer(value),
			});
		}

		return this.addProperty(key, value, this.getDefaultExportValue());
	}

	private createInitializer(value: SupportedConfigValues): any {
		if (typeof value === "string") {
			return `'${value}'`;
		} else if (typeof value === "number" || typeof value === "boolean") {
			return `${value}`;
		} else if (Array.isArray(value)) {
			return `[${value.map((v) => this.createInitializer(v)).join(", ")}]`;
		} else if (typeof value === "object" && value !== null) {
			const properties = Object.entries(value)
				.map(([key, val]) => `${key}: ${this.createInitializer(val)}`)
				.join(", ");
			return `{ ${properties} }`;
		}
		return `{}`;
	}

	private setInitializerValue(
		initializer: any,
		newValue: SupportedConfigValues,
	) {
		if (Node.isStringLiteral(initializer)) {
			return (initializer as StringLiteral).setLiteralValue(newValue as string);
		}

		if (Node.isNumericLiteral(initializer)) {
			return (initializer as NumericLiteral).setLiteralValue(
				newValue as number,
			);
		}

		if (Node.isBooleanKeyword(initializer)) {
			return (initializer as BooleanLiteral).setLiteralValue(
				newValue as boolean,
			);
		}

		if (Node.isIdentifier(initializer)) {
			return this.setIdentifierValue(initializer as Identifier, newValue);
		}

		throw new Error("Unsupported value type: " + initializer.getKindName());
	}

	private getInitializerValue(initializer: any) {
		if (Node.isStringLiteral(initializer)) {
			return (initializer as StringLiteral).getLiteralValue();
		}

		if (Node.isNumericLiteral(initializer)) {
			return (initializer as NumericLiteral).getLiteralValue();
		}

		if (Node.isBooleanKeyword(initializer)) {
			return (initializer as BooleanLiteral).getLiteralValue();
		}

		if (Node.isIdentifier(initializer)) {
			return this.getIdentifierValue(initializer as Identifier);
		}

		throw new Error("Unsupported value type: " + initializer.getKindName());
	}

	private getIdentifierValue(identifier: Identifier): any {
		const decl = this.config.getVariableDeclarationOrThrow(
			identifier.getText(),
		);
		const initializer = decl.getInitializerOrThrow();

		return this.getInitializerValue(initializer);
	}

	private setIdentifierValue(
		identifier: Identifier,
		newValue: SupportedConfigValues,
	) {
		const decl = this.config.getVariableDeclarationOrThrow(
			identifier.getText(),
		);
		const initializer = decl.getInitializerOrThrow();

		this.setInitializerValue(initializer, newValue);
	}

	private getPropertyValue(objectProperty: ObjectLiteralElementLike) {
		if (!objectProperty) {
			return undefined;
		}

		let initializer;
		if (
			objectProperty instanceof PropertyAssignment ||
			objectProperty instanceof ShorthandPropertyAssignment
		) {
			initializer = objectProperty.getInitializer();
		} else {
			throw new Error(
				"getPropertyValue Unsupported value found: " +
					objectProperty.getKindName(),
			);
		}

		if (Node.isStringLiteral(initializer)) {
			return (initializer as StringLiteral).getLiteralValue();
		}

		if (Node.isNumericLiteral(initializer)) {
			return (initializer as NumericLiteral).getLiteralValue();
		}

		if (Node.isBooleanKeyword(initializer)) {
			return (initializer as BooleanLiteral).getLiteralValue();
		}

		if (Node.isIdentifier(initializer)) {
			return this.getIdentifierValue(initializer as Identifier);
		}
	}

	private setPropertyValue(
		objectProperty: any,
		newValue: SupportedConfigValues,
	) {
		let initializer;
		if (
			objectProperty instanceof PropertyAssignment ||
			objectProperty instanceof ShorthandPropertyAssignment
		) {
			initializer = objectProperty.getInitializer();
		} else {
			throw new Error("Unsupported value found.");
		}

		this.setInitializerValue(initializer, newValue);
	}

	/**
	 * @internal
	 */
	getFullText() {
		return this.config.getFullText();
	}

	/**
	 * @internal
	 */
	getValue(key: string) {
		return this.getPropertyValue(this.getProperty(key));
	}

	public setValue(key: string, value: SupportedConfigValues): string {
		const property = this.getProperty(key);

		if (!property) {
			// add new property
			this.addProperty(key, value);
		} else {
			this.setPropertyValue(property, value);
		}

		return this.getFullText();
	}
}
