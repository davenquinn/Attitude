import {selection, select, selectAll} from "d3-selection";
import {transition} from "d3-transition";
import selection_attrs from "d3-selection-multi/src/selection/attrs";
import selection_styles from "d3-selection-multi/src/selection/styles";
import selection_properties from "d3-selection-multi/src/selection/properties";
import transition_attrs from "d3-selection-multi/src/transition/attrs";
import transition_styles from "d3-selection-multi/src/transition/styles";

selection.prototype.attrs = selection_attrs;
selection.prototype.styles = selection_styles;
selection.prototype.properties = selection_properties;
transition.prototype.attrs = transition_attrs;
transition.prototype.styles = transition_styles;

export {selection, transition, select, selectAll}