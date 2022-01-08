import "core-js/stable";
import "regenerator-runtime/runtime";

import { FocusStyleManager } from "@blueprintjs/core";
import "@blueprintjs/core/lib/css/blueprint.css";
import "@macrostrat/ui-components/lib/esm/index.css";

FocusStyleManager.onlyShowFocusOnTabs();
import h from "@macrostrat/hyper";
import { render } from "react-dom";
import { App } from "./app";

render(h(App), document.getElementById("root"));
