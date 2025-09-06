export const config = {
  matcher: [
    '*',
    '!/public/:path*',
    '!/api/proxy/:path*'
  ]
};

export default function middleware(req) {
  // 输出请求相关日志
  console.log(`[Middleware] 收到请求，URL: ${req.url}`);
  console.log(`[Middleware] 请求方法: ${req.method}`);
  console.log(`[Middleware] 请求头 Referer: ${req.headers.get('referer') || '无'}`);

  // 提取 Referer 头（即目标转发地址）
  const referer = req.headers.get('referer');
  if (!referer) {
    console.error('[Middleware] 错误：Referer 头不存在');
    return new Response('Referer header is required', { status: 400 });
  }

  // 解析 Referer 为 URL 对象
  const refererUrl = new URL(referer);
  console.log(`[Middleware] 解析到 Referer 地址: ${refererUrl.toString()}`);
  
  // 构造新的目标 URL
  const newUrl = new URL(req.url);
  newUrl.host = refererUrl.host;
  newUrl.pathname = refererUrl.pathname + newUrl.pathname;
  console.log(`[Middleware] 构造的新目标 URL: ${newUrl.toString()}`);

  // 重写请求到新 URL
  console.log(`[Middleware] 开始重定向到新 URL`);
  return Response.redirect(newUrl.toString(), 307);
}
