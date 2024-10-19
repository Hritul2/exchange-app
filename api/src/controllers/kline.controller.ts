import { ApiError } from "@/utils/ApiError";
import { ApiResponse } from "@/utils/ApiResponse";
import { asyncHandler } from "@/utils/asyncHandler";
import db from "@/db";

export const getKline = asyncHandler(async (req, res) => {
  const { market, interval, startTime, endTime } = req.query;
  if (!market) {
    throw new ApiError(400, "Missing required query parameter: market");
  }
  if (!interval) {
    throw new ApiError(400, "Missing required query parameter: interval");
  }
  if (!startTime) {
    throw new ApiError(400, "Missing required query parameter: startTime");
  }
  if (!endTime) {
    throw new ApiError(400, "Missing required query parameter: endTime");
  }

  let query;
  switch (interval) {
    case "1m":
      query = db.kline1m.findMany({
        where: {
          bucket: {
            gte: new Date(Number(startTime) * 1000),
            lte: new Date(Number(endTime) * 1000),
          },
        },
      });
      break;
    case "1h":
      query = db.kline1h.findMany({
        where: {
          bucket: {
            gte: new Date(Number(startTime) * 1000),
            lte: new Date(Number(endTime) * 1000),
          },
        },
      });
      break;
    case "1w":
      query = db.kline1w.findMany({
        where: {
          bucket: {
            gte: new Date(Number(startTime) * 1000),
            lte: new Date(Number(endTime) * 1000),
          },
        },
      });
      break;
    default:
      throw new ApiError(400, "Invalid interval");
  }

  const result = await query;
  if (!result) {
    throw new ApiError(404, "No data found for the given symbol");
  }
  let response = result.map((x) => ({
    close: x.close,
    end: x.bucket,
    high: x.high,
    low: x.low,
    open: x.open,
    quoteVolume: x.quoteVolume,
    start: x.start,
    trades: x.trades,
    volume: x.volume,
  }));
  res.status(200).json(new ApiResponse(200, response));
});
