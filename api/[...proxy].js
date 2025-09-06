export default async (req, res) => {
  // 打印原始请求信息（方法、URL、 headers）
  console.log(`[Proxy Request] Method: ${req.method}, Original URL: ${req.url}`);
  console.log(`[Proxy Request] Headers:`, JSON.stringify(req.headers, null, 2));

  try {
    // 解析代理路径（区分 /proxy 和 /httpproxy）
    let proxyType = 'https';
    let proxyPath = req.url;
    
    if (proxyPath.startsWith('/proxy/')) {
      proxyPath = proxyPath.replace(/^\/proxy\//, "");
    } else if (proxyPath.startsWith('/httpproxy/')) {
      proxyType = 'http';
      proxyPath = proxyPath.replace(/^\/httpproxy\//, "");
    } else {
      throw new Error(`Invalid proxy path: ${req.url}. Use /proxy/... or /httpproxy/...`);
    }

    const targetUrl = `${proxyType}://${proxyPath}`;
    console.log(`[Proxy Target] Resolved URL: ${targetUrl}`); // 打印目标URL

    // 发送代理请求
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers
    });

    // 打印响应状态
    console.log(`[Proxy Response] Status: ${response.status}, Status Text: ${response.statusText}`);

    // 设置响应头和内容
    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');

    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status).send(buffer);

  } catch (e) {
    // 打印错误详情
    console.error(`[Proxy Error] Message: ${e.message}, Stack: ${e.stack}`);
    res.status(500).send(`Proxy Error: ${e.message}`);
  }
};
