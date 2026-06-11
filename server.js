const http = require("http");
const check = require("./api/check");

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://localhost`);
  if (urlObj.pathname === "/api/check") {
    req.query = Object.fromEntries(urlObj.searchParams);
    check(req, res);
  } else if (urlObj.pathname === "/" ) {
    const fs = require("fs");
    const html = fs.readFileSync("./public/index.html", "utf8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
  } else {
    res.writeHead(404);
    res.end("Not found");
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
