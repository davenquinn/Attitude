/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {
  Stereonet,
  opacityByCertainty,
  globalLabels,
  chroma,
} from "@attitude/core/src";
import {
  hyperbolicErrors,
  apparentDip,
  digitizedLine,
  PlaneData,
  fixAngle,
} from "@attitude/core/src";
import style from "./ui-styles.styl";
import "@blueprintjs/core/lib/css/blueprint.css";
import { InteractiveStereonetComponent } from "./components/stereonet";
import { SideViewComponent } from "./components/side-view";
import { DataPanelComponent } from "./components/data-panel";
import { SelectionListComponent } from "./components/list";
import h from "react-hyperscript";
import React from "react";
import ReactDOM from "react-dom";
import * as d3 from "d3";
import "d3-jetpack";
import { FocusStyleManager, Tab, Tabs } from "@blueprintjs/core";

FocusStyleManager.onlyShowFocusOnTabs();

class AttitudeUI extends React.Component {
  static initClass() {
    this.defaultProps = {
      width: 760,
      attitudes: [],
      stereonetPrecision: 0.1,
      allowGroupSelection: true,
    };
  }
  constructor(props) {
    this.getData = this.getData.bind(this);
    this.onStereonetRotate = this.onStereonetRotate.bind(this);
    this.onHover = this.onHover.bind(this);
    super(props);
    this.state = {
      showGroups: true,
      azimuth: 0,
      hovered: null,
      zoomedToSelection: false,
      selection: [],
    };
  }
  findAttitudes(list) {
    const { attitudes } = this.props;
    const out = [];
    for (var o of Array.from(list)) {
      out.push(attitudes.find((d) => o === d.uid));
    }
    return out;
  }

  render() {
    const { attitudes, stereonetPrecision, width } = this.props;
    const { azimuth, hovered, selection, showGroups, zoomedToSelection } =
      this.state;
    const data = attitudes;
    const { onHover } = this;
    const { updateSelection } = this;

    const selectionList = h(SelectionListComponent, {
      attitudes,
      selection,
      showGroups,
      zoomedToSelection,
      zoomToSelection: () => {
        return this.setState({
          zoomedToSelection: !this.state.zoomedToSelection,
        });
      },
      onToggleShowGroups: () => {
        return this.setState({ showGroups: !this.state.showGroups });
      },
      onHover,
      onClearSelection: (d) => this.setState({ selection: [] }),
      hovered,
      onClick: (d) => {
        return this.updateSelection([d]);
      },
    });

    const dataPanel = h(DataPanelComponent, { attitude: hovered });

    return h("div.attitude-area", { style: { width } }, [
      h("div.row", [
        h(InteractiveStereonetComponent, {
          data: this.getData(),
          onRotate: this.onStereonetRotate,
          onHover,
          updateSelection,
          precision: stereonetPrecision,
          hovered,
        }),
        h(Tabs, { className: "data-panel" }, [
          h(Tab, { id: "measurement-data", title: "Info", panel: dataPanel }),
          h(Tab, { id: "selection-list", title: "List", panel: selectionList }),
          h(Tabs.Expander),
        ]),
      ]),
      //h SideViewComponent, {data, azimuth, hovered,
      //                      onHover, updateSelection}
    ]);
  }

  getData() {
    const { attitudes } = this.props;
    const { zoomedToSelection, selection } = this.state;
    if (!zoomedToSelection) {
      return attitudes;
    }
    return selection;
  }

  onStereonetRotate(pos) {
    const [lon, lat] = pos;
    const azimuth = (-Math.PI / 180) * lon;
    return this.setState({ azimuth });
  }

  onHover(d) {
    let hovered;
    if (d == null) {
      this.setState({ hovered: null });
      return;
    }
    // Transfer selection to group
    if (d.member_of != null) {
      const newSel = this.findAttitudes([d.member_of])[0];
      if (newSel != null) {
        d = newSel;
      }
    }
    if (d.members != null) {
      hovered = [d, ...this.findAttitudes(d.members)];
    } else {
      hovered = [d];
    }
    console.log(hovered);
    return this.setState({ hovered });
  }

  componentDidMount() {
    return d3
      .select(ReactDOM.findDOMNode(this))
      .on("mouseenter", function () {
        console.log("Focusing on", this);
        return this.focus();
      })
      .on("mouseleave", () => this.onHover());
  }

  updateSelection(ids) {
    const collectedIDs = this.state.selection;
    for (let id of Array.from(ids)) {
      if (id.members != null && !this.props.allowGroupSelection) {
        continue;
      }
      const ix = collectedIDs.indexOf(id);
      if (ix === -1) {
        collectedIDs.push(id);
      } else {
        collectedIDs.splice(ix, 1);
      }
    }
    return this.setState({ selection: collectedIDs });
  }
}
AttitudeUI.initClass();

const createUI = function (node, data) {
  const el = h(AttitudeUI, { attitudes: data });
  return ReactDOM.render(el, node);
};

// global.attitudeUI = createUI
// global.d3 = d3

export { createUI, AttitudeUI, InteractiveStereonetComponent as Stereonet };
