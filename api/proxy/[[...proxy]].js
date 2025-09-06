export default async (req, res) => {
  try {
    console.log('[Proxy] 开始处理请求，请求URL:', req.url);
    const url = new URL(req.url, `https://${req.headers.host}`);
    const purePath = url.pathname;
    console.log('[Proxy] 纯净路径提取结果:', purePath);

    const targetPath = purePath.replace(/^\/api\/proxy\//, '');
    if (!targetPath) {
      console.error('[Proxy] 错误：无效的目标URL，路径提取为空');
      return res.status(400).send("Invalid target URL");
    }
    console.log('[Proxy] 目标路径截取后:', targetPath);

    const targetUrl = `https://${targetPath}`;
    console.log('[Proxy] 最终转发URL拼接完成:', targetUrl);

    console.log('[Proxy] 正在向目标URL发起请求:', targetUrl);
    console.log('[Proxy] 请求方法:', req.method);
    console.log('[Proxy] 请求头信息（部分关键）:');
    console.log(`  Host: ${new URL(targetUrl).host}`);
    console.log(`  User-Agent: ${req.headers['user-agent'] || '无'}`);
    console.log(`  Content-Type: ${req.headers['content-type'] || 'application/json'}`); // 打印 Content-Type

    // 自定义函数：获取请求体文本内容
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

    // 获取请求体并打印日志
    const requestBody = req.body ? await getRequestBody(req) : undefined;
    console.log('[Proxy] 转发的请求体内容:', requestBody || '空'); // 关键日志：确认请求体

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Host: new URL(targetUrl).host,
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Content-Type': req.headers['content-type'] || 'application/json', // 补充关键头
        'Authorization': req.headers['authorization'] || '' // 可选：传递鉴权头
      },
      body: requestBody,
    });

    console.log('[Proxy] 目标网站响应状态码:', response.status);
    // 若目标网站返回 500，打印错误响应体
    let responseText = await response.text();
    if (response.status === 500) {
      console.error('[Proxy] 目标网站 500 错误响应体:', responseText); // 关键日志：错误详情
    }

    console.log('[Proxy] 响应头信息（部分关键）:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const contentType = response.headers.get('Content-Type') || 'text/plain';
    console.log('[Proxy] 响应内容类型:', contentType);
    console.log('[Proxy] 响应内容长度（近似）:', responseText.length, '字节');

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
