interface IHmrStatusService {
	getHmrStatus(deviceId: string, operationHash: string): Promise<number>;
	attachToHrmStatusEvent(): void;
}