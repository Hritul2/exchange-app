import { z } from "zod";

export const actionTypesSchema = z.enum([
  "CREATE_ORDER",
  "CANCEL_ORDER",
  "ON_RAMP",
  "GET_DEPTH",
  "GET_OPEN_ORDERS",
]);

export enum ActionTypesEnum {
  CREATE_ORDER = "CREATE_ORDER",
  CANCEL_ORDER = "CANCEL_ORDER",
  ON_RAMP = "ON_RAMP",
  GET_DEPTH = "GET_DEPTH",
  GET_OPEN_ORDERS = "GET_OPEN_ORDERS",
}

export type ActionTypes = z.infer<typeof actionTypesSchema>;
