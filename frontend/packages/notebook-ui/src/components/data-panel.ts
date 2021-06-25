/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import h from "react-hyperscript";
import React from "react";
import { format } from "d3";

const fmt = format("3.1f");

class AngularMeasurement extends React.Component {
  render() {
    let { label, datum } = this.props;
    if (datum == null) {
      datum = "";
    }
    return h("li", [label, h("span.data", fmt(datum)), "º"]);
  }
}

class DataPanelComponent extends React.Component {
  render() {
    let memberInfo;
    let { attitude, selection } = this.props;
    if (attitude == null || attitude.length === 0) {
      return h("div.plane-desc", [
        h("p", {}, "Roll over a measurement to see details"),
      ]);
    }
    attitude = attitude[0];

    let { strike, dip, uid, members } = attitude;

    if (members == null) {
      members = [];
    }
    if (members.length > 0) {
      memberInfo = h("p", `Group of ${members.length} measurements`);
    }

    return h("div.plane-desc", [
      h("h3.data-id", ["ID: ", h("span.data.id", uid)]),
      memberInfo,
      h("h4", "Nominal Plane"),
      h("ul", [
        h(AngularMeasurement, { label: "Strike: ", datum: strike }),
        h(AngularMeasurement, { label: "Dip:    ", datum: dip }),
      ]),
      h("h4", "Angular errors"),
      this.angularErrors(),
    ]);
  }

  angularErrors() {
    const { min_angular_error, max_angular_error } = this.props.attitude[0];
    if (min_angular_error < 0.01 && max_angular_error < 0.01) {
      return h("p", "No errors recorded");
    }
    return h("ul", [
      h(AngularMeasurement, { label: "Min: ", datum: min_angular_error }),
      h(AngularMeasurement, { label: "Max: ", datum: max_angular_error }),
    ]);
  }
}

export { DataPanelComponent };
