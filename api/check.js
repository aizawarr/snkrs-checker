const puppeteer = require("puppeteer-core");

module.exports = async (req, res) => {
  const sendJson = (status, data) => {
    const body = JSON.stringify(data);
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(body);
  };

  if (req.method === "OPTIONS") {
    res.writeHead(200, { "Access-Control-Allow-Origin": "*" });
    res.end();
    return;
  }

  const { url } = req.query;
  if (!url) return sendJson(400, { error: "url required" });

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable",
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1");
    await page.setExtraHTTPHeaders({ "Accept-Language": "ja-JP,ja;q=0.9" });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 });

    const result = await page.evaluate(() => {
      const name =
        document.querySelector('h1[data-test="product-title"]')?.innerText ||
        document.querySelector("h1")?.innerText ||
        "不明な商品";

      const script = document.getElementById("__NEXT_DATA__");
      if (!script) return { name, sizes: [] };

      const json = JSON.parse(script.textContent);
      function findKey(obj, key, depth = 0) {
        if (depth > 8 || !obj || typeof obj !== "object") return null;
        if (key in obj) return obj[key];
        for (const v of Object.values(obj)) {
          const r = findKey(v, key, depth + 1);
          if (r) return r;
        }
        return null;
      }

      const skus = findKey(json, "skus") || [];
      const availableSkus = findKey(json, "availableSkus") || [];
      const availableIds = new Set(availableSkus.map(a => a.id));

      const sizes = skus.map(sku => ({
        label: sku.localizedSize || sku.nikeSize,
        available: availableIds.has(sku.id),
      })).filter(s => s.label);

      return { name, sizes };
    });

    sendJson(200, result);
  } catch (err) {
    sendJson(500, { error: err.message });
  } finally {
    if (browser) await browser.close();
  }
};
