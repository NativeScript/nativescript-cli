declare module "xmlhttprequest" {
	export interface XMLHttpRequest extends Function {
		withCredentials: boolean;
		UNSENT: number;
		OPENED: number;
		HEADERS_RECEIVED: number;
		LOADING: number;
		DONE: number;
		readyState: number;
		onreadystatechange: Function;
		responseText: string;
		responseXML: string;
		status: number;
		statusText: string;
		setTimeout: Function;
		open: Function;
		setDisableHeaderCheck: Function;
		setRequestHeader: Function;
		getResponseHeader: Function;
		getAllResponseHeaders: Function;
		getRequestHeader: Function;
		send: Function;
		handleError: Function;
		abort: Function;
		addEventListener: Function;
		removeEventListener: Function;
		dispatchEvent: [Function];
	}
}
