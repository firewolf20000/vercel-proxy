export default async (req, res) => {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const purePath = url.pathname;
    console.log("纯净路径:", purePath);

    const targetPath = purePath.replace(/^\/api\/proxy\//, '');
    if (!targetPath) {
      return res.status(400).send("Invalid target URL");
    }
    console.log("提取的目标路径:", targetPath);

    const targetUrl = `https://${targetPath}`;
    console.log("最终转发URL:", targetUrl);

    // 关键：覆盖 Host 头为目标网站的 Host
    const modifiedHeaders = {
      ...req.headers,
      Host: new URL(targetUrl).host, // 提取 targetUrl 的 Host（如 www.baidu.com）
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' // 模拟浏览器 User-Agent
    };

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: modifiedHeaders, // 使用修改后的请求头
      body: req.body ? await req.text() : undefined,
    });

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.send(await response.text());
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).send("Proxy failed: " + err.message);
  }
};
