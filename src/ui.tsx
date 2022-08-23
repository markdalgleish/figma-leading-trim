import {
  Button,
  Columns,
  Container,
  IconLineHeight32,
  render,
  Textbox,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useEffect, useState } from "preact/hooks";
import {
  SelectionChangedHandler,
  SelectionData,
  TrimSelectionHandler,
  UpdateFontSizeHandler,
  UpdateLineHeightHandler,
} from "./types";

function serializeLineHeight(lineHeight: LineHeight) {
  if (lineHeight.unit === "AUTO") {
    return "Auto";
  }

  return `${lineHeight.value}${lineHeight.unit === "PERCENT" ? "%" : ""}`;
}

function deserializeLineHeight(lineHeightString: string): LineHeight | null {
  if (lineHeightString === "Auto") {
    return { unit: "AUTO" } as const;
  }

  if (/^[1-9?][0-9]*$/.test(lineHeightString)) {
    return { unit: "PIXELS", value: parseInt(lineHeightString) } as const;
  }

  if (/^[1-9?][0-9]*%$/.test(lineHeightString)) {
    return { unit: "PERCENT", value: parseInt(lineHeightString) } as const;
  }

  return null;
}

export default render(function Plugin({
  fontSize: initialFontSize,
  lineHeight: initialLineHeight,
  hasTextSelected: initialHasTextSelected,
}: SelectionData) {
  const [fontSizeFieldValue, setFontSizeFieldValue] = useState<string>(
    initialFontSize ? String(initialFontSize) : ""
  );
  const [lineHeightFieldValue, setLineHeightFieldValue] = useState<string>(() =>
    initialLineHeight ? serializeLineHeight(initialLineHeight) : ""
  );
  const [hasTextSelected, setHasTextSelected] = useState(
    initialHasTextSelected
  );

  const handleTrimButtonClick = useCallback(function () {
    emit<TrimSelectionHandler>("TRIM_SELECTION");
  }, []);

  useEffect(() => {
    on<SelectionChangedHandler>(
      "SELECTION_CHANGED",
      ({ fontSize, lineHeight, hasTextSelected }) => {
        setFontSizeFieldValue(fontSize ? String(fontSize) : "");
        setLineHeightFieldValue(
          lineHeight ? serializeLineHeight(lineHeight) : ""
        );
        setHasTextSelected(hasTextSelected);
      }
    );
  }, []);

  return (
    <Container space="small">
      <VerticalSpace space="small" />
      <Columns>
        <div
          onKeyDown={(event) => {
            // We need this event handler attached to a parent div
            // because TextBox doesn't support the onKeyDown event.
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
              event.preventDefault();

              if (
                event.target instanceof HTMLInputElement &&
                /^[1-9][0-9]?$/.test(event.target.value)
              ) {
                const newFontSize =
                  parseInt(event.target.value) +
                  (event.shiftKey ? 10 : 1) *
                    (event.key === "ArrowDown" ? -1 : 1);
                setFontSizeFieldValue(String(newFontSize));
                emit<UpdateFontSizeHandler>(
                  "UPDATE_FONT_SIZE_FOR_SELECTION",
                  newFontSize
                );
              }
            }
          }}
        >
          <Textbox
            onInput={(event) => {
              setFontSizeFieldValue(event.currentTarget.value);
            }}
            validateOnBlur={(value) => {
              if (!/^[1-9][0-9]?$/.test(value)) {
                return false;
              }

              setFontSizeFieldValue(value);
              emit<UpdateFontSizeHandler>(
                "UPDATE_FONT_SIZE_FOR_SELECTION",
                parseInt(value)
              );

              return true;
            }}
            value={fontSizeFieldValue}
          />
        </div>
        <div
          onKeyDown={(event) => {
            // We need this event handler attached to a parent div
            // because TextBox doesn't support the onKeyDown event.
            if (event.key === "ArrowUp" || event.key === "ArrowDown") {
              event.preventDefault();

              if (event.target instanceof HTMLInputElement) {
                const parsedLineHeight = deserializeLineHeight(
                  event.target.value
                );
                if (parsedLineHeight && parsedLineHeight.unit !== "AUTO") {
                  const newLineHeight = {
                    ...parsedLineHeight,
                    value:
                      parsedLineHeight.value +
                      (event.shiftKey ? 10 : 1) *
                        (event.key === "ArrowDown" ? -1 : 1),
                  };
                  setLineHeightFieldValue(serializeLineHeight(newLineHeight));
                  emit<UpdateLineHeightHandler>(
                    "UPDATE_LINE_HEIGHT_FOR_SELECTION",
                    newLineHeight
                  );
                }
              }
            }
          }}
        >
          <Textbox
            icon={<IconLineHeight32 />}
            onInput={(event) => {
              setLineHeightFieldValue(event.currentTarget.value);
            }}
            validateOnBlur={(value) => {
              const parsedLineHeight = deserializeLineHeight(value);

              if (parsedLineHeight === null) {
                return false;
              }

              emit<UpdateLineHeightHandler>(
                "UPDATE_LINE_HEIGHT_FOR_SELECTION",
                parsedLineHeight
              );

              return true;
            }}
            value={lineHeightFieldValue}
          />
        </div>
      </Columns>
      <VerticalSpace space="large" />
      <Button
        secondary
        disabled={!hasTextSelected}
        fullWidth
        onClick={handleTrimButtonClick}
      >
        Trim selection
      </Button>
      <VerticalSpace space="small" />
    </Container>
  );
});
