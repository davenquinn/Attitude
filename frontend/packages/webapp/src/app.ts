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

function fillEmptyRows(
  data: SheetContent,
  requiredLength: number = 10
): SheetContent {
  const nToAdd = requiredLength - data.length;
  if (nToAdd <= 0) return data;
  let emptyData = orientationFields.map((d) => {
    return { value: null };
  });
  const addedRows = Array(requiredLength).fill(emptyData);

  console.log(addedRows);

  return [...data, ...addedRows];
}

export function App() {
  const [state, setState] = useState<Orientation[]>(defaultOrientations);

  return h("div.app", [
    h("h1", "Uncertain orientations plotter"),
    h(AttitudeUI),
    h(ReactDataSheet, {
      data: fillEmptyRows(state.map(transformData)),
      valueRenderer: (cell) => cell.value,
    }),
    h(Button, { size: "small" }, "Add more rows"),
  ]);
}
