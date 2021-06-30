import h from "@macrostrat/hyper";
import { Orientation, getColor } from "@attitude/core";
import { Stereonet } from "@attitude/notebook-ui/src";
import ReactDataSheet, { DataEditor } from "react-datasheet";
import "react-datasheet/lib/react-datasheet.css";
import update, { Spec } from "immutability-helper";
import { Button, ButtonGroup } from "@blueprintjs/core";
import { useStoredState, ErrorBoundary } from "@macrostrat/ui-components";
import { SketchPicker } from "react-color";
import React, { useState } from "react";
import { Popover2 } from "@blueprintjs/popover2";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import chroma from "chroma-js";

//import classNames from "classnames";
interface GridElement extends ReactDataSheet.Cell<GridElement, number> {
  value: number | null;
}

type OrientationRow = Partial<Orientation> | null;
type OrientationData = OrientationRow[];

function ColorEditor(props) {
  const { value, onKeyDown, onChange } = props;
  //const initialColor = chroma(value);
  //const [editingColor, setColor] = useState(initialColor);
  console.log(value);
  const target = h("span.popover-target");

  let color = null;
  try {
    color = chroma(value).hex();
  } catch {}
  console.log(color);
  return h([
    h(DataEditor, props),
    h("span.popover-container", [
      h(
        Popover2,
        {
          content: h(
            "div.interaction-barrier",
            {
              onMouseDown(evt) {
                evt.nativeEvent.stopImmediatePropagation();
              },
              onKeyDown(evt) {
                console.log(evt);
              }
            },
            [
              h(ErrorBoundary, [
                h(SketchPicker, {
                  disableAlpha: true,
                  color: color ?? "#aaaaaa",
                  onChange(color, evt) {
                    let c = "";
                    console.log(color);
                    try {
                      c = chroma(color.hex).name();
                    } finally {
                      onChange(c);
                      evt.stopPropagation();
                    }
                  }
                })
              ])
            ]
          ),
          enforceFocus: false,
          autoFocus: false,
          minimal: true,
          modifiers: {
            offset: { enabled: true, options: { offset: [0, 8] } }
          },
          interactionKind: "hover-target",
          isOpen: true,
          onClose(evt) {
            console.log("trying to close");
            onKeyDown(evt);
          },
          usePortal: false
        },
        target
      )
    ])
  ]);
}

class OrientationDataSheet extends ReactDataSheet<GridElement, number> {}
type SheetContent = GridElement[][];

export interface Field<Key> {
  name: string;
  key: Key;
  required?: boolean;
  isValid?(k: any): boolean;
  transform?(k: any): any;
  dataEditor?: ReactDataSheet.DataEditor<ReactDataSheet.Cell<any, any>>;
}

type OrientationKey =
  | "strike"
  | "dip"
  | "rake"
  | "maxError"
  | "minError"
  | "color";

export const orientationFields: Field<OrientationKey>[] = [
  { name: "Strike", key: "strike" },
  { name: "Dip", key: "dip" },
  { name: "Rake", key: "rake" },
  { name: "Max.", key: "maxError", category: "Errors" },
  { name: "Min.", key: "minError", category: "Errors" },
  {
    name: "Color",
    key: "color",
    required: false,
    isValid: d => getColor(d) != null,
    transform: d => d,
    dataEditor: ColorEditor
  }
];

export function addEmptyRows(
  data: SheetContent,
  modulus: number = 10,
  targetN = 0
): SheetContent {
  const nToAdd =
    Math.ceil((data.length + targetN) / modulus) * modulus - data.length;
  if (nToAdd <= 0) return data;
  const emptyData = Array(orientationFields.length).fill({ value: null });
  const addedRows = Array(nToAdd).fill(emptyData);
  return [...data, ...addedRows];
}

function Columns() {
  return h("colgroup", [
    h("col.index-column", { key: "index" }),
    orientationFields.map(({ key }) => {
      return h("col", {
        className: key,
        key
      });
    })
  ]);
}

function Row(props) {
  const { children, row } = props;
  return h("tr", [h("td.index-cell.cell.read-only.index", row + 1), children]);
}

function Header() {
  return h("thead", [
    h("tr.header", [
      h("td.index-column.cell.read-only", ""),
      orientationFields.map((col, index) => {
        return h(
          "td.cell.header.read-only.header-cell",
          {
            key: col.key,
            index
          },
          col.name
        );
      })
    ])
  ]);
}

function Sheet({ className, children }) {
  return h("table", { className }, [
    h(Columns),
    h(Header),
    h("tbody", children)
  ]);
}

export function getFieldData<K>(field: Field<K>): Field<K> {
  const {
    transform = d => parseFloat(d),
    isValid = d => !isNaN(d),
    required = true,
    ...rest
  } = field;
  return { ...rest, transform, isValid, required };
}

function Controls({ data, updateData, resetData }) {
  return h("div.controls", [
    h(ButtonGroup, [
      h(
        Button,
        {
          onClick() {
            updateData(addEmptyRows(data, 10, 10));
          }
        },
        "Add more rows"
      ),
      h(
        Button,
        {
          onClick: resetData
        },
        "Reset data"
      )
    ])
  ]);
}

function enhanceData(row: GridElement[]): any[] {
  console.log(row);
  if (row == null) return [];
  return row.map((cellData, i) => {
    const { dataEditor, key } = getFieldData(orientationFields[i]);

    let addedProps = {};
    // if (key == "color") {
    //   addedProps.valueViewer = cell =>
    //     h(
    //       "span.value-viewer",
    //       { style: { color: getColor(cell.value), bacbac  } },
    //       cell.value
    //     );
    // }

    return { dataEditor, ...cellData, ...addedProps };
  });
}

function DataSheet({ data, updateData }) {
  return h(ReactDataSheet, {
    data: data.map(enhanceData),
    valueRenderer: (cell, row, col) => {
      return cell.value;
    },
    rowRenderer: Row,
    sheetRenderer: Sheet,
    attributesRenderer(cell, row, col) {
      if (cell.value == null || cell.value == "")
        return { "data-status": "empty" };
      const { isValid } = getFieldData(orientationFields[col]);
      const status = isValid(cell.value) ? "ok" : "invalid";
      return { "data-status": status };
    },
    onContextMenu: (...args) => {
      console.log("Context menu");
      console.log(args);
    },
    onCellsChanged: changes => {
      let spec: Spec<SheetContent> = {};
      changes.forEach(({ cell, row, col, value }) => {
        if (!(row in spec)) spec[row] = {};
        spec[row][col] = { $set: { value } };
      });
      updateData(update(data, spec));
    }
  });
}

export function DataArea({ data, updateData, resetData }) {
  return h("div.data-area", [
    h(
      "p.instructions",
      "Enter data here. Use degrees for orientations, and html colors (string, rgba, or hex codes). Pasting from a spreadsheet should work!"
    ),
    h("div.data-area-main", [
      h("div.left-column", [
        h(ErrorBoundary, null, h(DataSheet, { data, updateData })),
        h(Controls, { data, updateData, resetData })
      ]),

      h("div.sidebar", [])
    ])
  ]);
}
