import h from "@macrostrat/hyper";
import { Orientation, getColor } from "@attitude/core";
import { Stereonet } from "@attitude/notebook-ui/src";
import ReactDataSheet from "react-datasheet";
import "react-datasheet/lib/react-datasheet.css";
import update, { Spec } from "immutability-helper";
import { Button, ButtonGroup } from "@blueprintjs/core";
import { useStoredState, ErrorBoundary } from "@macrostrat/ui-components";
import { SketchPicker } from "react-color";
import React, { useState } from "react";
//import classNames from "classnames";
interface GridElement extends ReactDataSheet.Cell<GridElement, number> {
  value: number | null;
}

type OrientationRow = Partial<Orientation> | null;
type OrientationData = OrientationRow[];

function ColorEditor({
  handleChange,
  handleKeyDown,
  onCommit,
  onRevert,
  value
}) {
  const [editingColor, setColor] = useState(value);

  return h("div", "I am an editor");
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
  return h("tr", [h("td.index-cell.cell.read-only.index", row), children]);
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

function Controls({ updateData }) {
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
          onClick() {
            updateData(defaultData);
          }
        },
        "Reset data"
      )
    ])
  ]);
}

export function DataArea({ data, updateData }) {
  return h("div.data-area", [
    h(
      "p.instructions",
      "Enter data here. Use degrees for orientations, and html colors (string, rgba, or hex codes). Pasting from a spreadsheet should work!"
    ),
    h("div.data-area-main", [
      h("div.left-column", [
        h(
          ErrorBoundary,
          null,
          h(ReactDataSheet, {
            data,
            valueRenderer: (cell, row, col) => {
              return cell.value;
            },
            rowRenderer: Row,
            sheetRenderer: Sheet,
            attributesRenderer(cell, row, col) {
              if (cell.value == null) return { "data-status": "empty" };
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
          })
        ),
        h(Controls, { updateData })
      ]),

      h("div.sidebar", [h(SketchPicker)])
    ])
  ]);
}
