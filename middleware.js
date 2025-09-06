export const config = {
  matcher: '/:path*' // 匹配所有路径
};

export default function middleware(req) {
  // 1. 提取当前请求的路径（如 /market_scan）
  const currentPath = new URL(req.url).pathname;
  console.log(`[Middleware] 当前请求路径: ${currentPath}`);

  // 2. 排除路径规则（不变）
  const excludePaths = [
    '/public',
    '/public/:path*',
    '/api/proxy',
    '/api/proxy/:path*'
  ];
  const isExcluded = excludePaths.some(pattern => {
    if (!pattern.includes(':path*')) return currentPath === pattern;
    const basePattern = pattern.replace(':path*', '');
    return currentPath.startsWith(basePattern);
  });
  if (isExcluded) {
    console.log(`[Middleware] 路径 ${currentPath} 被排除，直接放行`);
    return;
  }

  // 3. 处理转发逻辑（核心修改：按 Referer 格式提取基础路径）
  const referer = req.headers.get('referer');
  if (!referer) {
    console.error(`[Middleware] 错误 | Referer 缺失 | 请求路径: ${currentPath}`);
    return new Response('Referer header is required', { status: 400 });
  }

  try {
    const refererUrl = new URL(referer);
    console.log(`[Middleware] 解析 Referer | 完整地址: ${refererUrl.href}`);

    // 关键：提取 Referer 中 /api/proxy/ 后的“基础路径”（即 fiewolf1000-stockany2.hf.space）
    // 无论 Referer 是 /api/proxy/xxx 还是 /api/proxy/xxx/yyy，都只取 xxx 作为基础
    const proxyPrefix = '/api/proxy/';
    const refererPath = refererUrl.pathname;
    // 找到 /api/proxy/ 后的部分（如 "fiewolf1000-stockany2.hf.space" 或 "fiewolf1000-stockany2.hf.space/market_scan"）
    const afterProxy = refererPath.slice(refererPath.indexOf(proxyPrefix) + proxyPrefix.length);
    // 提取基础路径（去掉 afterProxy 中第一个 "/" 后的所有内容，即保留 xxx）
    const baseTargetPath = afterProxy.split('/')[0]; // 结果：fiewolf1000-stockany2.hf.space

    if (!baseTargetPath) {
      throw new Error(`无法从 Referer 提取基础路径，Referer 路径: ${refererPath}`);
    }

    // 构造最终目标 URL：/api/proxy/基础路径 + 当前请求路径（如 /market_scan）
    const newUrl = new URL(req.url);
    newUrl.pathname = `${proxyPrefix}${baseTargetPath}${currentPath}`;
    // 保留代理域名（fxproxy.15115656.xyz），不修改 host
    console.log(`[Middleware] 构造新 URL | 目标: ${newUrl.href}`);

    return Response.redirect(newUrl.toString(), 307); // 307 保留原请求方法
  } catch (err) {
    console.error(`[Middleware] 异常 | 解析失败 | 错误: ${err.message} | Referer: ${referer}`);
    return new Response('Invalid Referer URL', { status: 400 });
  }
}
