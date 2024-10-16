import express, { Request, Response, NextFunction } from "express";
import { createProxyMiddleware, RequestHandler } from "http-proxy-middleware";

const app = express();

const targetUrl = "https://api.backback.exchange";

app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range");
  next();
});

app.use(
  "/",
  createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
  }) as RequestHandler
);

const port = 8080;

app.listen(port, () => {
  console.log(`Proxy Server is running on port ${port}`);
});
