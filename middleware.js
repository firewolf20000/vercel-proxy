export const config = {
  // 关键修正：否定规则必须完整写全路径（!/ + /public/... → 实际为 !/public/:path*，无多余符号）
  matcher: [
    // 1. 匹配所有路径（根路径 + 所有子路径）
    '/',
    '/:path*',
    // 2. 排除 /public 及其所有子路径（格式：!/ + 完整路径）
    '!/public',
    '!/public/:path*',
    // 3. 排除 /api/proxy 及其所有子路径
    '!/api/proxy',
    '!/api/proxy/:path*'
  ]
};

export default function middleware(req) {
  // 1. 输出请求基础日志
  console.log(`[Middleware] 收到请求 | URL: ${req.url} | 方法: ${req.method}`);
  const referer = req.headers.get('referer');
  console.log(`[Middleware] 请求头 Referer: ${referer || '未提供'}`);

  // 2. 校验 Referer 是否存在
  if (!referer) {
    console.error(`[Middleware] 错误 | Referer 缺失 | 请求 URL: ${req.url}`);
    return new Response('Referer header is required', { status: 400 });
  }

  // 3. 解析 Referer 并构造新 URL（捕获解析错误）
  try {
    const refererUrl = new URL(referer);
    console.log(`[Middleware] 解析 Referer | 地址: ${refererUrl.href}`);

    // 拼接新 URL：Referer 路径 + 原请求路径（如 /api/active_tasks）
    const newUrl = new URL(req.url);
    newUrl.host = refererUrl.host;
    newUrl.pathname = refererUrl.pathname + newUrl.pathname;
    console.log(`[Middleware] 构造新 URL | 目标: ${newUrl.href}`);

    // 4. 307 重定向（保留原请求方法）
    console.log(`[Middleware] 重定向 | ${req.url} → ${newUrl.href}`);
    return Response.redirect(newUrl.href, 307);
  } catch (err) {
    console.error(`[Middleware] 异常 | 解析失败 | 错误: ${err.message} | Referer: ${referer}`);
    return new Response('Invalid Referer URL', { status: 400 });
  }
}
