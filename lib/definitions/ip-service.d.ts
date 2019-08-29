/**
 * Describes the service used to get information for the current IP Address.
 */
interface IIPService {
	/**
	 * Gives information about the current public IPv4 address.
	 * @returns {Promise<string>} The IP address or null in case unable to find the current IP.
	 */
	getCurrentIPv4Address(): Promise<string>;
}
