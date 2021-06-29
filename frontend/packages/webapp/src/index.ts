import h from "@macrostrat/hyper";
import { render } from "react-dom";
import "@macrostrat/ui-components/init";
import "@blueprintjs/popover2/lib/css/blueprint-popover2.css";
import { App } from "./app";
import "./main.styl";

render(h(App), document.getElementById("root"));
