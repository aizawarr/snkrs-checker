const http = require("http");
const check = require("./api/check");

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://localhost`);

  if (urlObj.pathname === "/debug/chrome") {
    const { execSync } = require("child_process");
    try {
      const result = execSync("find / -name 'chrome' -type f 2>/dev/null | grep -v proc | head -5").toString();
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(result || "Not found");
    } catch(e) {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Error: " + e.message);
    }
  } else if (urlObj.pathname === "/api/check") {
    req.query = Object.fromEntries(urlObj.searchParams);
    check(req, res);
  } else {
    const fs = require("fs");
    const html = fs.readFileSync("./public/index.html", "utf8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
