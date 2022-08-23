import { FontMetrics } from "@capsizecss/core";
import googleFontMetrics from "./googleFonts.json";
import systemFontMetrics from "./systemFonts.json";

export const fontMetricsByFamilyName: Record<string, FontMetrics> = {
  ...googleFontMetrics,
  ...systemFontMetrics,
};
