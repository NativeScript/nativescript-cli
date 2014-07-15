declare module "properties-parser" {
	function createEditor(path: string, callback: (err: IErrors, data: any) => void);
}