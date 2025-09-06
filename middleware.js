export const config = {
  matcher: [
    // 1. 匹配所有以 "/" 开头的路径（等效于“所有路径”，符合 Vercel 规范）
    '/:path*',
    // 2. 排除 /public 及其所有子路径（必须以 "/" 开头）
    '!/public/:path*',
    // 3. 排除 /api/proxy 及其所有子路径（必须以 "/" 开头）
    '!/api/proxy/:path*'
  ]
};

export default function middleware(req) {
  // 1. 输出请求基础信息日志
  console.log(`[Middleware] 收到请求 → URL: ${req.url} | 方法: ${req.method}`);
  const referer = req.headers.get('referer');
  console.log(`[Middleware] 请求头 Referer: ${referer || '未提供'}`);

  // 2. 校验 Referer 是否存在
  if (!referer) {
    console.error(`[Middleware] 错误 → 请求缺少 Referer 头，URL: ${req.url}`);
    return new Response('Referer header is required', { status: 400 });
  }

  // 3. 解析 Referer 和构造新 URL
  try {
    const refererUrl = new URL(referer);
    console.log(`[Middleware] 解析 Referer → 完整地址: ${refererUrl.toString()}`);
    
    const newUrl = new URL(req.url);
    newUrl.host = refererUrl.host; // 继承 Referer 的主机
    newUrl.pathname = refererUrl.pathname + newUrl.pathname; // 拼接原请求路径
    console.log(`[Middleware] 构造新 URL → ${newUrl.toString()}`);

    // 4. 重定向并输出日志
    console.log(`[Middleware] 重定向 → 从 ${req.url} 到 ${newUrl.toString()}（状态码 307）`);
    return Response.redirect(newUrl.toString(), 307); // 307 保留原请求方法
  } catch (err) {
    // 5. 捕获 URL 解析错误
    console.error(`[Middleware] 异常 → 解析 URL 失败，错误: ${err.message}`);
    return new Response('Invalid URL in Referer', { status: 400 });
  }
}
