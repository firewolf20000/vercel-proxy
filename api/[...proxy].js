import fetch from 'node-fetch';

export default async (req, res) => {
  // 从URL拼接出目标地址
  const targetUrl = req.url.replace(/^\/api\/proxy\//, "https://").replace(/^\/api\/httpproxy\//, "http://");

  try {
    // 获取目标资源
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers
    });

    // Content-Type 透传，提升静态资源（如CSS）的兼容性
    const contentType = response.headers.get('content-type');
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }

    // CORS 允许跨域
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 代理 HTML 时自动重写相对资源路径
    if (contentType && contentType.includes('text/html')) {
      let html = await response.text();
      // 把 src/href="/xxx" 改成 src="/api/proxy/目标域名/xxx"
      html = html.replace(/(src|href)=["']\/([^"']+)["']/g, (match, p1, p2) => {
        // 目标域名，比如 www.google.com
        const domain = targetUrl.match(/https?:\/\/([^\/]+)/)[1];
        return `${p1}="/api/proxy/${domain}/${p2}"`;
      });
      res.send(html);
    } else {
      // 其它资源如CSS、图片等，直接流式转发
      const buffer = await response.buffer();
      res.send(buffer);
    }
  } catch (e) {
    res.status(500).send('Proxy Error: ' + e.message);
  }
};