export default async (req, res) => {
  try {
    // 1. 解析URL，强制分离路径和查询参数
    const url = new URL(req.url, `https://${req.headers.host}`);
    const purePath = url.pathname; // 只取路径部分（不含查询参数）
    console.log("纯净路径:", purePath); // 例如：/api/proxy/www.sohu.com

    // 2. 提取目标路径（仅保留路径部分）
    const targetPath = purePath.replace(/^\/api\/proxy\//, '');
    if (!targetPath) {
      return res.status(400).send("Invalid target URL");
    }
    console.log("提取的目标路径:", targetPath); // 例如：www.sohu.com

    // 3. 拼接目标URL（不带多余查询参数）
    const targetUrl = `https://${targetPath}`;
    console.log("最终转发URL:", targetUrl); // 例如：https://www.sohu.com

    // 4. 转发请求
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: req.headers,
      body: req.body ? await req.text() : undefined,
    });

    // 5. 转发响应
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
