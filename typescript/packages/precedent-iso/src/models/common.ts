import { z } from "zod";

export const ZTrafficLightAnswer = z.enum(["red", "yellow", "green"]);
export type TrafficLightAnswer = z.infer<typeof ZTrafficLightAnswer>;
