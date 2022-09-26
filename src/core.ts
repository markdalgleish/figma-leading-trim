import { FontMetrics, precomputeValues } from "@capsizecss/core";
import { loadFontsAsync } from "@create-figma-plugin/utilities";
import { fontMetricsByFamilyName } from "./metrics/fontMetricsByFamilyName";

function isNodeOwned(node: SceneNode) {
  return node.getPluginData("owned") === "true";
}

function markNodeAsOwned(node: SceneNode) {
  node.setPluginData("owned", "true");
}

export function getFontMetricsForTextNode(
  textNode: TextNode
): FontMetrics | null {
  if (
    textNode.fontName !== figma.mixed &&
    textNode.fontName.family in fontMetricsByFamilyName
  ) {
    return fontMetricsByFamilyName[textNode.fontName.family];
  }

  return null;
}

export function resolveTextNodeFromSelectedNode(
  sceneNode: SceneNode
): TextNode | undefined {
  const textNode =
    sceneNode.type === "TEXT"
      ? sceneNode
      : sceneNode.type === "FRAME" &&
        isNodeOwned(sceneNode) &&
        sceneNode.children.length === 1 &&
        sceneNode.children[0].type === "TEXT"
      ? sceneNode.children[0]
      : undefined;

  return textNode;
}

function resolveLineHeightFromTextNode(textNode: TextNode): number | undefined {
  if (
    textNode.lineHeight === figma.mixed ||
    textNode.fontSize === figma.mixed
  ) {
    return undefined;
  }

  return textNode.lineHeight.unit !== "AUTO"
    ? textNode.lineHeight.unit === "PERCENT"
      ? textNode.fontSize * (textNode.lineHeight.value / 100)
      : textNode.lineHeight.value
    : undefined;
}

export async function trimSelectedNodes({
  fontSize,
  lineHeight,
}: {
  fontSize?: number;
  lineHeight?: LineHeight;
} = {}) {
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
      const textNode = resolveTextNodeFromSelectedNode(selectedNode);

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

      function notify(message: string) {
        figma.notify(message, { timeout: 5000 });
      }

      if (fontFamilies.size > 1) {
        notify("Leading cannot be trimmed from text with mixed fonts.");
        return selectedNode;
      }

      const fontFamily = Array.from(fontFamilies)[0];
      if (!(fontFamily in fontMetricsByFamilyName)) {
        notify(
          `Leading cannot be trimmed from font "${fontFamily}" as it is not currently supported.`
        );
        return selectedNode;
      }

      if (textNode.fontSize === figma.mixed) {
        notify("Leading cannot be trimmed from text with mixed sizes.");
        return selectedNode;
      }

      if (textNode.lineHeight === figma.mixed) {
        notify("Leading cannot be trimmed from text with mixed line heights.");
        return selectedNode;
      }

      if (textNode.textAutoResize === "NONE") {
        textNode.textAutoResize = "HEIGHT";
      }

      let frameYBeforeUpdate: number | null = null;
      const isUpdatingLineHeight = lineHeight;

      if (fontSize || isUpdatingLineHeight) {
        frameYBeforeUpdate =
          textNode.parent?.type === "FRAME" && isNodeOwned(textNode.parent)
            ? textNode.parent.y
            : null;
      }

      if (fontSize) {
        textNode.fontSize = fontSize;
      }

      if (isUpdatingLineHeight) {
        textNode.lineHeight = lineHeight;
      }

      const options = {
        fontSize: textNode.fontSize,
        leading: resolveLineHeightFromTextNode(textNode),
        fontMetrics: fontMetricsByFamilyName[fontFamily],
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
        frame.y = frameYBeforeUpdate ?? frame.y + textNode.y - marginTop;
      }

      textNode.x = 0;
      textNode.y = marginTop;

      return frame;
    }
  );
}
