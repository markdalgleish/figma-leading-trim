import { EventHandler } from "@create-figma-plugin/utilities";

export type SelectionData = {
  fontSize?: number;
  lineHeight?: LineHeight;
  autoLineHeight?: number;
  hasTextSelected: boolean;
  hasSupportedFontSelected: boolean;
};

export interface TrimSelectionHandler extends EventHandler {
  name: "TRIM_SELECTION";
  handler: () => void;
}

export interface UpdateFontSizeHandler extends EventHandler {
  name: "UPDATE_FONT_SIZE_FOR_SELECTION";
  handler: (fontSize: number) => void;
}

export interface UpdateLineHeightHandler extends EventHandler {
  name: "UPDATE_LINE_HEIGHT_FOR_SELECTION";
  handler: (lineHeight: LineHeight) => void;
}

export interface SelectionChangedHandler extends EventHandler {
  name: "SELECTION_CHANGED";
  handler: (selectionData: SelectionData) => void;
}
