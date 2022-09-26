import { on, emit, showUI } from "@create-figma-plugin/utilities";
import {
  trimSelectedNodes,
  resolveTextNodeFromSelectedNode,
  getFontMetricsForTextNode,
} from "../../core";
import {
  TrimSelectionHandler,
  UpdateFontSizeHandler,
  UpdateLineHeightHandler,
  SelectionChangedHandler,
  SelectionData,
} from "../../types";

const lineHeightDelimiter = "|";

function stringifyLineHeight(lineHeight: LineHeight): string {
  return [
    lineHeight.unit,
    "value" in lineHeight ? String(lineHeight.value) : null,
  ]
    .filter((value) => value !== null)
    .join(lineHeightDelimiter);
}

function parseLineHeight(lineHeight: string): LineHeight {
  const [unit, value] = lineHeight.split(lineHeightDelimiter);

  if (unit === "AUTO") {
    return { unit: "AUTO" };
  }

  if (unit === "PERCENT" || unit === "PIXELS") {
    return { unit, value: parseInt(value) };
  }

  throw new Error("Invalid line height string");
}

function getSelectionData(): SelectionData {
  const fontSizes = new Set<number>();
  const stringifiedLineHeights = new Set<string>();
  const autoLineHeights = new Set<number>();
  let hasTextSelected = false;
  let hasSupportedFontSelected = false;

  figma.currentPage.selection.forEach((selectedNode) => {
    const textNode = resolveTextNodeFromSelectedNode(selectedNode);

    if (textNode) {
      hasTextSelected = true;

      const fontMetrics = getFontMetricsForTextNode(textNode);

      if (!fontMetrics) {
        return;
      }

      hasSupportedFontSelected = true;

      if (textNode.fontSize !== figma.mixed) {
        fontSizes.add(textNode.fontSize);
      }

      if (textNode.lineHeight !== figma.mixed) {
        stringifiedLineHeights.add(stringifyLineHeight(textNode.lineHeight));
      }

      if (
        textNode.fontSize !== figma.mixed &&
        textNode.lineHeight !== figma.mixed
      ) {
        const { descent, ascent, lineGap, unitsPerEm } = fontMetrics;
        const absoluteDescent = Math.abs(descent);
        const contentArea = ascent + lineGap + absoluteDescent;
        const lineHeightScale = contentArea / unitsPerEm;
        autoLineHeights.add(Math.round(lineHeightScale * textNode.fontSize));
      }
    }
  });

  return {
    fontSize: fontSizes.size === 1 ? Array.from(fontSizes)[0] : undefined,
    lineHeight:
      stringifiedLineHeights.size === 1
        ? parseLineHeight(Array.from(stringifiedLineHeights)[0])
        : undefined,
    autoLineHeight:
      autoLineHeights.size === 1 ? Array.from(autoLineHeights)[0] : undefined,
    hasTextSelected,
    hasSupportedFontSelected,
  };
}

export default function () {
  on<TrimSelectionHandler>("TRIM_SELECTION", () => trimSelectedNodes());

  on<UpdateLineHeightHandler>(
    "UPDATE_LINE_HEIGHT_FOR_SELECTION",
    (lineHeight) => {
      trimSelectedNodes({ lineHeight });
    }
  );

  on<UpdateFontSizeHandler>("UPDATE_FONT_SIZE_FOR_SELECTION", (fontSize) => {
    trimSelectedNodes({ fontSize });
  });

  figma.on("selectionchange", () => {
    const {
      fontSize,
      lineHeight,
      autoLineHeight,
      hasTextSelected,
      hasSupportedFontSelected,
    } = getSelectionData();
    emit<SelectionChangedHandler>("SELECTION_CHANGED", {
      fontSize,
      lineHeight,
      autoLineHeight,
      hasTextSelected,
      hasSupportedFontSelected,
    });
  });

  showUI(
    { width: 240, height: 108, title: "Leading Trim" },
    getSelectionData()
  );
}
