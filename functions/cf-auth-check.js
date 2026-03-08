// CloudFront Function: /music/* パス専用の認証チェック

function handler(event) {
  var request = event.request;
  var cookies = request.cookies || {};

  var authCookie = cookies['music_auth'];
  if (!authCookie) {
    return denyAccess();
  }

  var parts = authCookie.value.split('.');
  if (parts.length !== 2) {
    return denyAccess();
  }

  var expiry = parseInt(parts[0], 10);
  var now = Math.floor(Date.now() / 1000);
  if (isNaN(expiry) || now > expiry) {
    return denyAccess();
  }

  return request;
}

function denyAccess() {
  return {
    statusCode: 403,
    statusDescription: 'Forbidden',
    headers: { 'content-type': { value: 'text/plain' } },
    body: 'Forbidden'
  };
}
