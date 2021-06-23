import h from "@macrostrat/hyper";
import { render } from "react-dom";
import { AttitudeUI } from "attitude-notebook-ui/src/index.coffee";

render(h(AttitudeUI), document.getElementById("root"));
