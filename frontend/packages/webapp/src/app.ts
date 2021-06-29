import h from "@macrostrat/hyper";
import { Orientation, getColor } from "@attitude/core";
import { Stereonet } from "@attitude/notebook-ui/src";
import ReactDataSheet from "react-datasheet";
import "react-datasheet/lib/react-datasheet.css";
import { useStoredState } from "@macrostrat/ui-components";
import {
  DataArea,
  getFieldData,
  orientationFields,
  addEmptyRows
} from "./sheet";
//import classNames from "classnames";
interface GridElement extends ReactDataSheet.Cell<GridElement, number> {
  value: number | null;
}

type OrientationRow = Partial<Orientation> | null;
type OrientationData = OrientationRow[];

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

function transformData(data: OrientationRow): GridElement[] {
  return orientationFields.map(d => {
    const { dataEditor } = getFieldData(d);
    return { value: data[d.key] ?? null, dataEditor };
  });
}

const defaultData = addEmptyRows(defaultOrientations.map(transformData), 10);

function constructOrientation(row: OrientationRow): Orientation {
  // Construct an orientation from a row
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
}

export function App() {
  const [data, setState] = useStoredState<OrientationRow[]>(
    "orientation-data",
    defaultData
  );

  const cleanedData: Orientation[] = data
    .map(constructOrientation)
    .filter(d => d != null);

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
          drawPlanes: false
        })
      )
    ])
  ]);
}
