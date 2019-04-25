import { KinveyHttpRequest, HttpRequestMethod, KinveyHttpAuth, formatKinveyBaasUrl, KinveyBaasNamespace } from '../http';

export async function removeById(id: string, options: any = {}) {
  const request = new KinveyHttpRequest({
    method: HttpRequestMethod.DELETE,
    auth: KinveyHttpAuth.SessionOrMaster,
    url: formatKinveyBaasUrl(KinveyBaasNamespace.Blob, `/${id}`),
    timeout: options.timeout
  });
  const response = await request.execute();
  return response.data;
}
