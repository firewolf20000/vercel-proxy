export default async (req, res) => {
  try {
    // 1. 提取目标 URL（从请求路径中获取）
    // 示例路径：/api/proxy/httpbin.org/get → 提取 "httpbin.org/get"
    console.log("请求方法:", req.method);
    console.log("请求URL:", req.url);
    console.log("请求头:", req.headers);
    const targetPath = req.url.replace(/^\/api\/proxy\//, '');
    console.log("targetpath:",targetPath);
    if (!targetPath) {
      return res.status(400).send("Invalid target URL");
    }
    const targetUrl = `https://${targetPath}`; // 拼接完整目标 URL
    console.log("targetpath:",targetUrl);
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
