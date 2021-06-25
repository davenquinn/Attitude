import h from "@macrostrat/hyper";
import { Orientation } from "@attitude/core";
import { Stereonet } from "@attitude/notebook-ui/src";
import ReactDataSheet from "react-datasheet";
import { Button } from "evergreen-ui";
import "react-datasheet/lib/react-datasheet.css";
import update, { Spec } from "immutability-helper";
import { useState } from "react";
interface GridElement extends ReactDataSheet.Cell<GridElement, number> {
  value: number | null;
}

class OrientationDataSheet extends ReactDataSheet<GridElement, number> {}
type SheetContent = GridElement[][];

interface OrientationRow {
  strike: number | null;
  dip: number | null;
  rake: number | null;
  maxError: number | null;
  minError: number | null;
  color: string | null;
}

const defaultOrientations: Orientation[] = [
  { strike: 10, dip: 5, rake: 2, maxError: 4, minError: 2 },
];

interface Field<Key> {
  name: string;
  key: Key;
  required?: boolean;
}

type OrientationKey =
  | "strike"
  | "dip"
  | "rake"
  | "maxError"
  | "minError"
  | "color";

const orientationFields: Field<OrientationKey>[] = [
  { name: "Strike", key: "strike" },
  { name: "Dip", key: "dip" },
  { name: "Rake", key: "rake" },
  { name: "Max.", key: "maxError", category: "Errors" },
  { name: "Min.", key: "minError", category: "Errors" },
  { name: "Color", key: "color", required: false },
];

function transformData(data: Orientation): GridElement[] {
  return orientationFields.map((d) => {
    return { value: data[d.key] ?? null };
  });
}

function addEmptyRows(data: SheetContent, modulus: number = 10): SheetContent {
  const nToAdd = Math.ceil(data.length / modulus) * modulus - data.length;
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
        key,
      });
    }),
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
            index,
          },
          col.name
        );
      }),
    ]),
  ]);
}

function Sheet({ className, children }) {
  return h("table", { className }, [
    h(Columns),
    h(Header),
    h("tbody", children),
  ]);
}

function DataArea({ data, updateData }) {
  return h("div.data-area", [
    h(ReactDataSheet, {
      data,
      valueRenderer: (cell) => cell.value,
      rowRenderer: Row,
      sheetRenderer: Sheet,
      onCellsChanged: (changes) => {
        let spec: Spec<SheetContent> = {};
        changes.forEach(({ cell, row, col, value }) => {
          spec[row] ??= {};
          spec[row][col] = { $set: { value } };
        });
        updateData(update(data, spec));
      },
    }),
    h(Button, { size: "small" }, "Add more rows"),
  ]);
}

const defaultData = addEmptyRows(defaultOrientations.map(transformData), 10);

function constructOrientation(row): Orientation {
  // Construct an orientation from a row
  let ix = 0;
  let orientation: Partial<Orientation> = {};
  for (const field of orientationFields) {
    const required = field.required ?? true;
    // Validation
    let val = parseFloat(row[ix].value);
    if (required && isNaN(val)) return null;
    orientation[field.key] = val;
    ix++;
  }
  return orientation as Orientation;
}

export function App() {
  const [data, setState] = useState<SheetContent>(defaultData);

  const cleanedData: Orientation[] = data
    .map(constructOrientation)
    .filter((d) => d != null);

  console.log(cleanedData);

  return h("div.app", [
    h("h1", "Uncertain orientations plotter"),
    h("div.main", [
      h(DataArea, { data, updateData: setState }),
      h(
        "div.plot-area",
        null,
        h(Stereonet, {
          data: cleanedData,
          margin: 50,
          drawPoles: true,
          drawPlanes: false,
        })
      ),
    ]),
  ]);
}
