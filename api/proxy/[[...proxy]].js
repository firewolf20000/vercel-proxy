export default async (req, res) => {
  try {
    console.log('[Proxy] 开始处理请求，请求URL:', req.url);
    // 解析完整 URL（包含路径和查询参数）
    const url = new URL(req.url, `https://${req.headers.host}`);
    const purePath = url.pathname; // 路径部分（如 /api/proxy/xxx/api/stock_data）
    const queryParams = url.search; // 查询参数部分（如 ?stock_code=600519&...）
    console.log('[Proxy] 纯净路径提取结果:', purePath);
    console.log('[Proxy] 查询参数提取结果:', queryParams || '无'); // 新增日志：打印查询参数

    // 1. 提取目标路径（去掉 /api/proxy/ 前缀）
    const targetPath = purePath.replace(/^\/api\/proxy\//, '');
    if (!targetPath) {
      console.error('[Proxy] 错误：无效的目标URL，路径提取为空');
      return res.status(400).send("Invalid target URL");
    }
    console.log('[Proxy] 目标路径截取后:', targetPath);

    // 2. 拼接完整 targetUrl（路径 + 查询参数）
    const targetUrl = `https://${targetPath}${queryParams}`; // 关键：添加 queryParams
    console.log('[Proxy] 最终转发URL拼接完成:', targetUrl); // 此时 URL 含参数

    console.log('[Proxy] 正在向目标URL发起请求:', targetUrl);
    console.log('[Proxy] 请求方法:', req.method);
    console.log('[Proxy] 请求头信息（部分关键）:');
    console.log(`  Host: ${new URL(targetUrl).host}`);
    console.log(`  User-Agent: ${req.headers['user-agent'] || '无'}`);
    console.log(`  Content-Type: ${req.headers['content-type'] || 'application/json'}`);

    // 处理请求体（GET 请求无 body，不影响）
    async function getRequestBody(req) {
      return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          resolve(body);
        });
        req.on('error', (err) => {
          reject(err);
        });
      });
    }
    const requestBody = req.body ? await getRequestBody(req) : undefined;
    console.log('[Proxy] 转发的请求体内容:', requestBody || '空');

    // 3. 发起请求（携带完整 URL 和参数）
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Host: new URL(targetUrl).host,
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Authorization': req.headers['authorization'] || ''
      },
      body: requestBody, // GET 请求 body 会被忽略，无需担心
    });

    // 打印响应详情（含 400 错误体）
    console.log('[Proxy] 目标网站响应状态码:', response.status);
    let responseText = await response.text();
    if (response.status >= 400) {
      console.error('[Proxy] 目标网站错误响应体:', responseText); // 打印错误原因
    }

    console.log('[Proxy] 响应头信息（部分关键）:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const contentType = response.headers.get('Content-Type') || 'text/plain';
    console.log('[Proxy] 响应内容类型:', contentType);
    console.log('[Proxy] 响应内容长度（近似）:', responseText.length, '字节');

    // 转发响应给客户端
    console.log('[Proxy] 开始向客户端转发响应');
    res.status(response.status);
    res.setHeader('Content-Type', contentType);
    res.send(responseText);
    console.log('[Proxy] 响应转发完成，客户端已接收');

  } catch (err) {
    console.error('[Proxy] 错误：', err);
    res.status(500).send("Proxy failed: " + err.message);
  }
};
