import { loadFontsAsync } from "@create-figma-plugin/utilities";
import { precomputeValues, FontMetrics } from "@capsizecss/core";
import googleFontMetrics from "./metrics/googleFonts.json";
import systemFontMetrics from "./metrics/systemFonts.json";

const fontMetrics: Record<string, FontMetrics> = {
  ...googleFontMetrics,
  ...systemFontMetrics,
};

function isNodeOwned(node: SceneNode) {
  return node.getPluginData("owned") === "true";
}

function markNodeAsOwned(node: SceneNode) {
  node.setPluginData("owned", "true");
}

export default async function () {
  await loadFontsAsync(
    figma.currentPage.selection.reduce(
      (acc, selection) => [
        ...acc,
        selection,
        ...("children" in selection ? [...selection.children] : []),
      ],
      [] as SceneNode[]
    )
  );

  figma.currentPage.selection = figma.currentPage.selection.map(
    (selectedNode): SceneNode => {
      const textNode =
        selectedNode.type === "TEXT"
          ? selectedNode
          : selectedNode.type === "FRAME" &&
            isNodeOwned(selectedNode) &&
            selectedNode.children.length === 1 &&
            selectedNode.children[0].type === "TEXT"
          ? selectedNode.children[0]
          : null;

      if (!textNode) {
        return selectedNode;
      }

      const fontFamilies: Set<string> =
        textNode.fontName === figma.mixed
          ? new Set(
              textNode
                .getRangeAllFontNames(0, textNode.characters.length)
                .map((fontName) => fontName.family)
            )
          : new Set([textNode.fontName.family]);

      if (fontFamilies.size > 1) {
        figma.notify("Leading cannot be trimmed from text with mixed fonts.");
        return selectedNode;
      }

      const fontFamily = Array.from(fontFamilies)[0];
      if (!(fontFamily in fontMetrics)) {
        figma.notify(`The font "${fontFamily}" is not currently supported.`);
        return selectedNode;
      }

      if (textNode.fontSize === figma.mixed) {
        figma.notify("Leading cannot be trimmed from text with mixed sizes.");
        return selectedNode;
      }

      if (textNode.lineHeight === figma.mixed) {
        figma.notify(
          "Leading cannot be trimmed from text with mixed line heights."
        );
        return selectedNode;
      }

      if (textNode.textAutoResize === "NONE") {
        textNode.textAutoResize = "HEIGHT";
      }

      const options = {
        fontSize: textNode.fontSize,
        leading:
          textNode.lineHeight.unit !== "AUTO"
            ? textNode.lineHeight.unit === "PERCENT"
              ? textNode.fontSize * (textNode.lineHeight.value / 100)
              : textNode.lineHeight.value
            : undefined,
        fontMetrics: fontMetrics[fontFamily],
      };

      const capsizeValues = precomputeValues(options);
      const marginTop = Math.round(
        parseFloat(capsizeValues.capHeightTrim) * textNode.fontSize
      );

      const marginBottom = Math.round(
        parseFloat(capsizeValues.baselineTrim) * textNode.fontSize
      );

      // Add new margins
      const parent = textNode.parent ?? figma.currentPage;
      const index = parent.children.indexOf(textNode);

      const isFirstRun = parent.type !== "FRAME" || !isNodeOwned(parent);
      const frame = isFirstRun ? figma.createFrame() : (parent as FrameNode);
      markNodeAsOwned(frame);

      frame.name = " "; // This ensures a frame name is not visible in the UI
      frame.fills = [];
      frame.clipsContent = false; // Allows ascenders/descenders to be visible
      frame.resize(textNode.width, textNode.height + marginTop + marginBottom);

      if (isFirstRun) {
        frame.appendChild(textNode);
        frame.x = textNode.x;
        frame.y = textNode.y - marginTop;
        parent.insertChild(index, frame);
      } else {
        frame.x = frame.x + textNode.x;
        frame.y = frame.y + textNode.y - marginTop;
      }

      textNode.x = 0;
      textNode.y = marginTop;

      return frame;
    }
  );

  figma.closePlugin();
}
