import h from "@macrostrat/hyper";
import { Orientation, getColor } from "@attitude/core";
import { Stereonet } from "@attitude/notebook-ui/src";
import ReactDataSheet from "react-datasheet";
import "react-datasheet/lib/react-datasheet.css";
import { useStoredState } from "@macrostrat/ui-components";
import { Tab, Tabs, Card, NumericInput, Label } from "@blueprintjs/core";
import { DataArea, getFieldData, orientationFields } from "./sheet";
import {
  VerticalClippedStereonet,
  RectangularStereonet,
} from "@attitude/plots";

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
    color: "dodgerblue",
  },
];

function transformData(data: Orientation): GridElement[] {
  return orientationFields.map((d) => {
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

function ClippedStereonetPanel({ data }) {
  const [clipAngle, setClipAngle] = useStoredState("clipAngle", 15, (d) => {
    const val = parseFloat(d);
    return !isNaN(val) && val > 0 && val <= 90;
  });
  return h("div", [
    h(VerticalClippedStereonet, { data, clipAngle }),
    h(Card, { className: "controls" }, [
      h(Label, { className: "bp3-inline" }, [
        "Clip angle",
        h(NumericInput, {
          value: clipAngle,
          onValueChange: (e) => setClipAngle(e),
        }),
      ]),
    ]),
  ]);
}

function PlotTabs({ data }) {
  return h(Tabs, { renderActiveTabPanelOnly: true }, [
    h(Tab, {
      id: "stereonet",
      title: "Interactive stereonet",
      panel: h([
        h("p.description", "Full, upper-hemisphere stereonet"),
        h(Stereonet, {
          data,
          margin: 50,
          drawPoles: true,
          drawPlanes: false,
        }),
      ]),
    }),
    h(Tab, {
      id: "upper-hemisphere",
      title: "Vertical clipped stereonet",
      panel: h([
        h("p.description", "Poles to near-horizontal bedding"),
        h(ClippedStereonetPanel, { data }),
      ]),
    }),
    // h(Tab, {
    //   id: "rectangular",
    //   title: "Rectangular stereonet",
    //   panel: h([
    //     h("p", "Rectangular stereonet"),
    //     h(RectangularStereonet, { data: cleanedData }),
    //   ]),
    // }),
  ]);
}

export function App() {
  const [data, updateData, resetData] = useStoredState<SheetContent>(
    "orientation-data",
    defaultData
  );

  const cleanedData: Orientation[] = data
    .map(constructOrientation)
    .filter((d) => d != null);

  return h("div.app", [
    h("div.main", [
      h("div.left-panel", [
        h("h1", "Uncertain orientations plotter"),
        h("p.instructions", [
          "This is a webapp that can plot uncertain orientations from a spreadsheet. ",
          "You can download the plots for further adjustment in Illustrator using a SVG export plugin like ",
          h("a", { href: "https://svgexport.io" }, "SVGExport"),
          ". ",
        ]),
        h(
          "p.instructions",
          "Enter data here. Use degrees for orientations, and html colors (string, rgba, or hex codes). Pasting from a spreadsheet should work!"
        ),
        h(DataArea, { data, updateData, resetData }),
      ]),
      h("div.plot-area", null, h(PlotTabs, { data: cleanedData })),
    ]),
  ]);
}
