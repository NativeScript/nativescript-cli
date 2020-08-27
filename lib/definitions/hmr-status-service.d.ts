interface IHmrStatusService {
	watchHmrStatus(deviceId: string, operationHash: string): void;
	getHmrStatus(deviceId: string, operationHash: string): Promise<number>;
	attachToHmrStatusEvent(): void;
}
