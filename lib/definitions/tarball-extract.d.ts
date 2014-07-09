declare module "tarball-extract" {
	function extractTarball(sourceFile: string, destinationDir: string, callback: (err: any, data: any) => void);
}