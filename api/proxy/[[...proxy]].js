export default async (req, res) => {
  try {
    // 1. 提取目标 URL（从请求路径中获取）
    // 示例路径：/api/proxy/httpbin.org/get → 提取 "httpbin.org/get"
    return res.status(200).send(req.url);
    const targetPath = req.url.replace(/^\/api\/proxy\//, '');
    return res.status(200).send(targetPath);
    if (!targetPath) {
      return res.status(400).send("Invalid target URL");
    }
    const targetUrl = `https://${targetPath}`; // 拼接完整目标 URL

    // 2. 转发请求（包含请求方法、头、体）
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body ? await req.text() : undefined,
    });

    // 3. 转发响应（包含状态码、头、内容）
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
