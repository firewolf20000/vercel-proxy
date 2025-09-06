export const config = {
  // 匹配所有路径（交给中间件内部判断是否排除）
  matcher: '/:path*'
};

export default function middleware(req) {
  // 1. 提取请求路径
  const pathname = new URL(req.url).pathname;
  console.log(`[Middleware] 请求路径: ${pathname}`);

  // 2. 定义需要排除的路径规则
  const excludePaths = [
    '/public',          // 排除 /public 精确路径
    '/public/:path*',   // 排除 /public 下的所有子路径
    '/api/proxy',       // 排除 /api/proxy 精确路径
    '/api/proxy/:path*' // 排除 /api/proxy 下的所有子路径
  ];

  // 3. 检查请求路径是否需要排除
  const isExcluded = excludePaths.some(pattern => {
    // 处理精确路径（如 /public）
    if (!pattern.includes(':path*')) {
      return pathname === pattern;
    }
    // 处理子路径（如 /public/xxx）
    const basePattern = pattern.replace(':path*', '');
    return pathname.startsWith(basePattern);
  });

  if (isExcluded) {
    console.log(`[Middleware] 路径 ${pathname} 被排除，直接放行`);
    // 排除的路径：不做转发，让请求按 Vercel 原有逻辑处理（如访问静态资源）
    return;
  }

  // 4. 非排除路径：执行转发逻辑
  console.log(`[Middleware] 路径 ${pathname} 需转发，继续处理`);

  // 提取 Referer 头
  const referer = req.headers.get('referer');
  console.log(`[Middleware] 请求头 Referer: ${referer || '未提供'}`);

  if (!referer) {
    console.error(`[Middleware] 错误 | Referer 缺失 | 请求路径: ${pathname}`);
    return new Response('Referer header is required', { status: 400 });
  }

  try {
    const refererUrl = new URL(referer);
    console.log(`[Middleware] 解析 Referer | 地址: ${refererUrl.href}`);

    const newUrl = new URL(req.url);
    newUrl.host = refererUrl.host;
    newUrl.pathname = refererUrl.pathname + newUrl.pathname;
    console.log(`[Middleware] 构造新 URL | 目标: ${newUrl.href}`);

    return Response.redirect(newUrl.href, 307);
  } catch (err) {
    console.error(`[Middleware] 异常 | 解析失败 | 错误: ${err.message} | Referer: ${referer}`);
    return new Response('Invalid Referer URL', { status: 400 });
  }
}
