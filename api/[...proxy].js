export default async (req, res) => {
  const proxyPath = req.url.replace(/^\/proxy\//, "");
  const targetUrl = "https://" + proxyPath;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers
    });

    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 支持所有资源类型的下载（包括 CSS、JS、图片、字体等）
    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status).send(buffer);
  } catch (e) {
    res.status(500).send('Proxy Error: ' + e.message);
  }
};
