import { Router } from "express";
import { getDepth } from "@/controllers/depth.controller";

export const depthRouter = Router();

depthRouter.get("/", getDepth);
