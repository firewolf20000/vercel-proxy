export default async (req, res) => {
  try {
    console.log('[Proxy] 开始处理请求，请求URL:', req.url);
    const url = new URL(req.url, `https://${req.headers.host}`);
    const purePath = url.pathname;
    const queryParams = url.search;
    console.log('[Proxy] 纯净路径提取结果:', purePath);
    console.log('[Proxy] 查询参数提取结果:', queryParams || '无');

    const targetPath = purePath.replace(/^\/api\/proxy\//, '');
    if (!targetPath) {
      console.error('[Proxy] 错误：无效的目标URL，路径提取为空');
      return res.status(400).send("Invalid target URL");
    }
    console.log('[Proxy] 目标路径截取后:', targetPath);

    const targetUrl = `https://${targetPath}${queryParams}`;
    console.log('[Proxy] 最终转发URL拼接完成:', targetUrl);

    console.log('[Proxy] 正在向目标URL发起请求:', targetUrl);
    console.log('[Proxy] 请求方法:', req.method);
    console.log('[Proxy] 请求头信息（部分关键）:');
    console.log(`  Host: ${new URL(targetUrl).host}`);
    console.log(`  User-Agent: ${req.headers['user-agent'] || '无'}`);
    console.log(`  Content-Type: ${req.headers['content-type'] || 'application/json'}`);

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

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Host: new URL(targetUrl).host,
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Authorization': req.headers['authorization'] || ''
      },
      body: requestBody,
    });

    console.log('[Proxy] 目标网站响应状态码:', response.status);
    const contentType = response.headers.get('Content-Type') || 'text/plain';
    console.log('[Proxy] 响应内容类型:', contentType);

    // 关键：区分响应类型，图片用 arrayBuffer，其他用 text
    let responseData;
    if (contentType.startsWith('image/')) {
      responseData = await response.arrayBuffer(); // 图片→二进制数组
      console.log('[Proxy] 图片响应，长度（字节）:', responseData.byteLength);
    } else {
      responseData = await response.text(); // 非图片→文本
      console.log('[Proxy] 文本响应，长度（字符）:', responseData.length);
    }

    console.log('[Proxy] 响应头信息（部分关键）:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    console.log('[Proxy] 开始向客户端转发响应');
    res.status(response.status);
    res.setHeader('Content-Type', contentType);
    // 关键：区分数据类型，Buffer 转二进制，文本直接发送
    if (contentType.startsWith('image/')) {
      res.send(Buffer.from(responseData)); // 二进制图片→Buffer 发送
    } else {
      res.send(responseData); // 文本→直接发送
    }
    console.log('[Proxy] 响应转发完成，客户端已接收');

  } catch (err) {
    console.error('[Proxy] 错误：', err);
    res.status(500).send("Proxy failed: " + err.message);
  }
};
