import { Request, RequestMethod } from '../http/request';

export default async function downloadByUrl(url, options = {}) {
  const request = new Request({
    method: RequestMethod.GET,
    url,
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
