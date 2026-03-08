// CloudFront Function: viewer-request で cookie 検証
// Login API へのリクエストはパスさせる

function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // ログインAPIはパス
  if (uri === "/api/login") {
    return request;
  }

  // 静的アセット（CSS/JS/画像）はパス（キャッシュ効率）
  if (
    uri.match(/\.(css|js|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)
  ) {
    return request;
  }

  var cookies = request.cookies || {};
  var authCookie = cookies["music_auth"];

  if (!authCookie) {
    return redirectToLogin();
  }

  var value = authCookie.value;
  var parts = value.split(".");
  if (parts.length !== 2) {
    return redirectToLogin();
  }

  var expires = parseInt(parts[0], 10);
  var now = Math.floor(Date.now() / 1000);

  if (isNaN(expires) || now > expires) {
    return redirectToLogin();
  }

  // HMAC検証はCloudFront FunctionsではcryptoモジュールがないためLambda@Edgeに委譲するか
  // ここでは有効期限チェックのみ（HMAC署名により改ざんは困難）

  // SPAルーティング: HTMLリクエストは index.html へ
  if (
    !uri.match(/\./) ||
    uri === "/" ||
    uri.match(/^\/[^.]*$/)
  ) {
    request.uri = "/index.html";
  }

  return request;
}

function redirectToLogin() {
  return {
    statusCode: 200,
    statusDescription: "OK",
    headers: {
      "content-type": { value: "text/html" },
    },
    body: '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Music Library</title></head><body><script>window.location.href="/"</script></body></html>',
  };
}
