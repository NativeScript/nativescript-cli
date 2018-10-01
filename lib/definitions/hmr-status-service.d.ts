interface IHmrStatusService {
	awaitHmrStatus(deviceId: string, operationHash: string): Promise<number>;
	attachToHrmStatusEvent(): void;
}