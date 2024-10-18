import express from "express";
import cors from "cors";

// routes to import
import { orderRouter } from "./routes/order.route";
import { depthRouter } from "./routes/depth.route";
import { tradesRouter } from "./routes/trades.route";
import { klineRouter } from "./routes/kline.route";
import { tickersRouter } from "./routes/ticker.route";

const app = express();
app.use(cors());

const apiRouter = express.Router();

apiRouter.use("/order", orderRouter);
apiRouter.use("/depth", depthRouter);
apiRouter.use("/trades", tradesRouter);
apiRouter.use("/klines", klineRouter);
apiRouter.use("/tickers", tickersRouter);

app.use("/api/v1", apiRouter);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
