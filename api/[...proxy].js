export default async (req, res) => {
  // 打印原始请求信息用于调试
  console.log(`[Proxy Request] Method: ${req.method}, URL: ${req.url}`);
  console.log(`[Proxy Request] Headers:`, JSON.stringify(req.headers, null, 2));

  try {
    // 从请求路径中提取代理目标（适配Vercel路由转发后的路径）
    const fullPath = req.url;
    let proxyType = 'https';
    let targetHost = '';

    // 匹配路由转发后的路径格式：/api/proxy/目标地址 或 /api/httpproxy/目标地址
    const httpsProxyMatch = fullPath.match(/^\/api\/proxy\/(.*)/);
    const httpProxyMatch = fullPath.match(/^\/api\/httpproxy\/(.*)/);

    if (httpsProxyMatch && httpsProxyMatch[1]) {
      targetHost = httpsProxyMatch[1];
      proxyType = 'https';
    } else if (httpProxyMatch && httpProxyMatch[1]) {
      targetHost = httpProxyMatch[1];
      proxyType = 'http';
    } else {
      throw new Error(`无效的代理路径格式: ${fullPath}，请使用 /proxy/目标地址 或 /httpproxy/目标地址`);
    }

    // 验证目标地址格式
    if (!targetHost || targetHost.trim() === '') {
      throw new Error('未指定代理目标地址，请在路径后添加需要访问的域名或URL');
    }

    // 构建完整目标URL
    const targetUrl = `${proxyType}://${targetHost}`;
    console.log(`[Proxy Target] 转发至: ${targetUrl}`);

    // 处理请求头（避免Vercel环境特定头被传递）
    const forwardHeaders = { ...req.headers };
    // 移除可能导致问题的请求头
    delete forwardHeaders.host;
    delete forwardHeaders['x-vercel-id'];
    delete forwardHeaders['x-forwarded-for'];

    // 发送代理请求
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
      redirect: 'follow' // 自动跟随重定向
    });

    console.log(`[Proxy Response] 状态: ${response.status}，来自: ${targetUrl}`);

    // 构建响应头（复制目标响应头并添加CORS支持）
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 发送响应内容
    const responseBody = await response.arrayBuffer();
    res.writeHead(response.status, Object.fromEntries(responseHeaders.entries()));
    res.end(Buffer.from(responseBody));

  } catch (error) {
    // 详细错误日志
    console.error(`[Proxy Error] 消息: ${error.message}\n堆栈: ${error.stack}`);
    // 返回友好错误信息
    res.status(500).json({
      error: '代理请求失败',
      details: error.message,
      path: req.url
    });
  }
};
