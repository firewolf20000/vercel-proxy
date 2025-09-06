export const config = {
  matcher: [
    // 1. 匹配所有路径（以 "/" 开头，符合规范）
    '/:path*',
    // 2. 排除 /public 及其所有子路径（否定匹配+以 "/" 开头，格式正确）
    '!/public/:path*',
    // 3. 排除 /api/proxy 及其所有子路径（同上）
    '!/api/proxy/:path*'
  ]
};

export default function middleware(req) {
  // 输出请求基础日志
  console.log(`[Middleware] 收到请求 | URL: ${req.url} | 方法: ${req.method}`);
  const referer = req.headers.get('referer');
  console.log(`[Middleware] 请求头 Referer: ${referer || '未提供'}`);

  // 校验 Referer 是否存在
  if (!referer) {
    console.error(`[Middleware] 错误 | Referer 头缺失 | 请求 URL: ${req.url}`);
    return new Response('Referer header is required', { status: 400 });
  }

  // 解析 Referer 并构造新 URL
  try {
    const refererUrl = new URL(referer);
    console.log(`[Middleware] 解析 Referer | 完整地址: ${refererUrl.href}`);

    const newUrl = new URL(req.url);
    newUrl.host = refererUrl.host; // 继承 Referer 的主机
    newUrl.pathname = `${refererUrl.pathname}${newUrl.pathname}`; // 拼接原请求路径
    console.log(`[Middleware] 构造新 URL | 目标地址: ${newUrl.href}`);

    // 重定向并输出日志
    console.log(`[Middleware] 重定向 | 原 URL: ${req.url} → 新 URL: ${newUrl.href}（状态码 307）`);
    return Response.redirect(newUrl.href, 307); // 307 保留原请求方法
  } catch (err) {
    // 捕获 URL 解析错误
    console.error(`[Middleware] 异常 | URL 解析失败 | 错误信息: ${err.message} | Referer: ${referer}`);
    return new Response('Invalid URL format in Referer', { status: 400 });
  }
}
