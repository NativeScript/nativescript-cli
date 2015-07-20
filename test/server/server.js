import UserRoutes from './routes/user';
require('Pretender');

export default function() {
  const server = new global.Pretender();

  server.prepareHeaders = function prepareHeaders(headers) {
    headers['content-type'] = 'application/json';
    return headers;
  };

  server.prepareBody = function prepareBody(body) {
    return body ? JSON.stringify(body) : JSON.stringify({ error: 'not found' });
  };

  server.route = function route() {
    server.map(UserRoutes);
  };

  return server;
}
