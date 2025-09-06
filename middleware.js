export const config = {
  matcher: '/:path*'
};

export default function middleware(req) {
  const pathname = new URL(req.url).pathname;
  console.log(`[Middleware] 请求路径: ${pathname}`);

  const excludePaths = [
    '/public',
    '/public/:path*',
    '/api/proxy',
    '/api/proxy/:path*'
  ];

  const isExcluded = excludePaths.some(pattern => {
    if (!pattern.includes(':path*')) {
      return pathname === pattern;
    }
    const basePattern = pattern.replace(':path*', '');
    return pathname.startsWith(basePattern);
  });

  if (isExcluded) {
    console.log(`[Middleware] 路径 ${pathname} 被排除，直接放行`);
    return;
  }

  console.log(`[Middleware] 路径 ${pathname} 需转发，继续处理`);
  const referer = req.headers.get('referer');
  console.log(`[Middleware] 请求头 Referer: ${referer || '未提供'}`);

  if (!referer) {
    console.error(`[Middleware] 错误 | Referer 缺失 | 请求路径: ${pathname}`);
    return new Response('Referer header is required', { status: 400 });
  }

  try {
    const refererUrl = new URL(referer);
    console.log(`[Middleware] 解析 Referer | 地址: ${refererUrl.href}`);

    // 关键修正：从 Referer 路径中提取目标网站主机（fiewolf1000-stockany2.hf.space）
    // Referer 路径格式：/api/proxy/[目标主机] → 提取 [目标主机] 部分
    const refererPathParts = refererUrl.pathname.split('/');
    const targetHost = refererPathParts[3]; // 索引3对应 "/api/proxy/[目标主机]" 中的目标主机
    if (!targetHost) {
      throw new Error(`无法从 Referer 提取目标主机，Referer 路径: ${refererUrl.pathname}`);
    }

    const newUrl = new URL(req.url);
    newUrl.host = targetHost; // 赋值为目标网站主机（如 fiewolf1000-stockany2.hf.space）
    newUrl.pathname = newUrl.pathname; // 保持原请求路径（如 /market_scan）
    console.log(`[Middleware] 构造新 URL | 目标: ${newUrl.href}`); // 最终应为 https://fiewolf1000-stockany2.hf.space/market_scan

    return Response.redirect(newUrl.href, 307);
  } catch (err) {
    console.error(`[Middleware] 异常 | 解析失败 | 错误: ${err.message} | Referer: ${referer}`);
    return new Response('Invalid Referer URL', { status: 400 });
  }
}
