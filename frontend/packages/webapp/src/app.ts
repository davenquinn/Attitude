import h from "@macrostrat/hyper";
import { AttitudeUI } from "attitude-notebook-ui/src/index.coffee";
import ReactDataSheet from "react-datasheet";
import { Button } from "evergreen-ui";
import "react-datasheet/lib/react-datasheet.css";
import { useState } from "react";
interface GridElement extends ReactDataSheet.Cell<GridElement, number> {
  value: number | null;
}

class OrientationDataSheet extends ReactDataSheet<GridElement, number> {}

interface AppState {
  grid: GridElement[][];
}

interface Orientation {
  strike: number;
  dip: number;
  rake: number;
  maxError: number;
  minError: number;
}

const defaultOrientations: Orientation[] = [
  { strike: 10, dip: 5, rake: 2, maxError: 4, minError: 2 },
];

const orientationFields = ["strike", "dip", "rake", "maxError", "minError"];

function transformData(data: Orientation): GridElement[] {
  return orientationFields.map((d) => {
    return { value: data[d] };
  });
}

type SheetContent = GridElement[][];

function addIndexColumn(data) {
  return data.map((d, i) => {
    const start = i > 0 ? { value: i, readOnly: true } : { readOnly: true };
    return [start, ...d];
  });
}

function fillEmptyRows(
  data: SheetContent,
  requiredLength: number = 10
): SheetContent {
  const nToAdd = requiredLength - data.length;
  if (nToAdd <= 0) return data;
  let emptyData = orientationFields.map((d) => {
    return { value: null };
  });

  const headerRow = orientationFields.map((d) => {
    return { readOnly: true, value: d };
  });

  const addedRows = Array(requiredLength).fill(emptyData);

  return addIndexColumn([headerRow, ...data, ...addedRows]);
}

function DataArea({ data, updateData }) {
  const nHeaderRows = 1;
  return h("div.data-area", [
    h(ReactDataSheet, {
      data: fillEmptyRows(data.map(transformData)),
      valueRenderer: (cell) => cell.value,
      onCellsChanged: (changes) => {
        let newData = [...data];
        changes.forEach(({ cell, row, col, value }) => {
          const ix = row - nHeaderRows;
          const field = orientationFields[col - 1];
          let val = value;
          if (val == "") val = null;
          newData[ix] = { ...newData[ix], [field]: value };
        });
        console.log(newData);
        updateData(newData);
      },
    }),
    h(Button, { size: "small" }, "Add more rows"),
  ]);
}

export function App() {
  const [state, setState] = useState<Orientation[]>(defaultOrientations);

  return h("div.app", [
    h("h1", "Uncertain orientations plotter"),
    h("div.main", [
      h(DataArea, { data: state, updateData: setState }),
      h("div.plot-area", null, h(AttitudeUI)),
    ]),
  ]);
}
