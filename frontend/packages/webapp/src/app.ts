import h from "@macrostrat/hyper";
import { AttitudeUI } from "attitude-notebook-ui/src/index.coffee";

export function App() {
  return h("div.app", [
    h("h1", "Uncertain orientations plotter"),
    h(AttitudeUI),
  ]);
}
