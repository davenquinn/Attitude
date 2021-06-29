import h from "@macrostrat/hyper";
import { Orientation, getColor } from "@attitude/core";
import { Stereonet } from "@attitude/notebook-ui/src";
import ReactDataSheet from "react-datasheet";
import "react-datasheet/lib/react-datasheet.css";
import { useStoredState } from "@macrostrat/ui-components";
import { DataArea, getFieldData, orientationFields } from "./sheet";
//import classNames from "classnames";
interface GridElement extends ReactDataSheet.Cell<GridElement, number> {
  value: number | null;
}

class OrientationDataSheet extends ReactDataSheet<GridElement, number> {}
type SheetContent = GridElement[][];

const defaultOrientations: Orientation[] = [
  { strike: 10, dip: 8, rake: 2, maxError: 20, minError: 8, color: "#65499e" },
  {
    strike: 120,
    dip: 46,
    rake: 5,
    maxError: 45,
    minError: 2,
    color: "dodgerblue"
  }
];

function transformData(data: Orientation): GridElement[] {
  return orientationFields.map(d => {
    return { value: data[d.key] ?? null, className: "test" };
  });
}

function addEmptyRows(
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

const defaultData = addEmptyRows(defaultOrientations.map(transformData), 10);

function constructOrientation(row: GridElement[]): Orientation {
  // Construct an orientation from a row
  try {
    let ix = 0;
    let orientation: Partial<Orientation> = {};
    for (const field of orientationFields) {
      const { transform, isValid, required } = getFieldData(field);

      // Validation
      let val = transform(row[ix].value);
      const valid = isValid(val);
      if (required && !valid) return null;
      if (valid) {
        orientation[field.key] = val;
      }
      ix++;
    }
    return orientation as Orientation;
  } catch (err) {
    return null;
  }
}

export function App() {
  const [data, updateData, resetData] = useStoredState<SheetContent>(
    "orientation-data",
    defaultData
  );

  const cleanedData: Orientation[] = data
    .map(constructOrientation)
    .filter(d => d != null);

  return h("div.app", [
    h("h1", "Uncertain orientations plotter"),
    h("div.main", [
      h(DataArea, { data, updateData, resetData }),
      h(
        "div.plot-area",
        null,
        h(Stereonet, {
          data: cleanedData,
          margin: 50,
          drawPoles: true,
          drawPlanes: false
        })
      )
    ])
  ]);
}
