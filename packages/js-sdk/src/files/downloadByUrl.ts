import { HttpRequest, HttpRequestMethod } from '../http';

export async function downloadByUrl(url: string, options: any = {}) {
  const request = new HttpRequest({
    method: HttpRequestMethod.GET,
    url,
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
