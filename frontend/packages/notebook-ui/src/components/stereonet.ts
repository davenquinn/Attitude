/*
 * decaffeinate suggestions:
 * DS002: Fix invalid constructor
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import ReactDOM from "react-dom";
import h from "react-hyperscript";
import * as d3 from "d3";
import {
  Stereonet,
  opacityByCertainty,
  globalLabels,
  chroma,
} from "@attitude/core/src";
import { Switch, Button, Card } from "@blueprintjs/core";

const setHoveredFill = function (d) {
  const s = d3.select(this);
  const err = s.select("path.error");
  err.styles({
    fill: d.color,
    stroke: d.color,
    "fill-opacity": 0.1,
  });
  s.select("path.nominal").style("stroke", d.color);
  if (d.member_of != null) {
    return;
  }
  return err.styles({
    "fill-opacity": 0.5,
  });
};

class StereonetComponent extends React.Component {
  static defaultProps = {
    onRotate() {},
    mode: "planes",
    drawPlanes: true,
    drawPoles: false,
    hovered: [],
    precision: 0.2,
    center: [0, 0],
    margin: 25,
  };
  constructor(props) {
    super(props);
    this.state = { center: this.props.center };
  }

  componentDidMount() {
    let { data, center, precision, margin } = this.props;
    this.stereonet = Stereonet().size(400).margin(margin);

    this.stereonet.projection().precision(precision);

    const node = ReactDOM.findDOMNode(this);
    const svg = d3.select(node).call(this.stereonet);

    this.updatePoles();
    this.updatePlanes();
    this.__finishUpdate();

    this.stereonet.call(globalLabels());
    return this.stereonet.on("rotate.cb", () => {
      center = this.stereonet.centerPosition();
      //@setState {center}
      return this.props.onRotate(center);
    });
  }

  componentDidUpdate(prevProps, prevState) {
    let { hovered, drawPlanes, drawPoles, data } = this.props;
    if (data !== prevProps.data) {
      drawPlanes = drawPoles = null;
    }
    if (prevProps.drawPlanes !== drawPlanes) {
      this.updatePlanes();
      hovered = null;
    }

    if (prevProps.drawPoles !== drawPoles) {
      this.updatePoles();
      hovered = null;
    }

    console.log(prevState, this.state);

    if (prevProps.center != this.props.center) {
      this.stereonet.center(this.props.center);
    }

    this.__finishUpdate();
    if (prevProps.hovered !== hovered) {
      return this.updateHovered();
    }
  }

  updateHovered() {
    console.log("Updating hovered on stereonet");
    const { hovered, drawPlanes, drawPoles } = this.props;
    this.stereonet.dataArea().select("g.hovered").remove();
    if (hovered == null) {
      return;
    }
    if (hovered.length === 0) {
      return;
    }
    if (drawPlanes) {
      this.stereonet
        .planes(hovered, { selector: "g.hovered" })
        .each(function () {
          return d3.select(this).select("path.nominal").remove();
        })
        .each(setHoveredFill)
        .classed("in-group", (d) => d.member_of != null)
        .classed("is-group", (d) => d.members != null);
    }
    if (drawPoles) {
      return this.stereonet
        .ellipses(hovered, { selector: "g.hovered" })
        .each(setHoveredFill)
        .classed("in-group", (d) => d.member_of != null)
        .classed("is-group", (d) => d.members != null);
    }
  }

  updatePlanes() {
    const { data, onHover, drawPlanes } = this.props;
    const c = (d) => d.color;

    console.log(data);

    this.stereonet.dataArea().select("g.planes").remove();
    if (!drawPlanes) {
      return;
    }

    return this.stereonet
      .planes(data)
      .each(opacityByCertainty(c, "path.error"))
      .classed("in-group", (d) => d.member_of != null)
      .classed("is-group", (d) => d.members != null)
      .each(function (d) {
        if (d.max_angular_error > 45) {
          d3.select(this).select("path.error").remove();
        }

        return d3.select(this).select("path.nominal").attr("stroke", d.color);
      });
  }

  updatePoles() {
    const { data, onHover, drawPoles } = this.props;
    const c = (d) => d.color;

    this.stereonet.dataArea().select("g.poles").remove();
    if (!drawPoles) {
      return;
    }

    return this.stereonet
      .ellipses(data)
      .each(opacityByCertainty(c, "path.error"))
      .classed("in-group", (d) => d.member_of != null)
      .classed("is-group", (d) => d.members != null);
  }

  __finishUpdate() {
    const { onHover } = this.props;
    this.stereonet.draw();
    return this.stereonet
      .dataArea()
      .selectAll("path.error")
      .on("mouseenter", function (d) {
        d = d3.select(this.parentElement).datum();
        return onHover(d);
      });
  }

  render() {
    return h("svg.stereonet");
  }
}

class InteractiveStereonetComponent extends React.Component {
  constructor(props) {
    super(props);
    this.setVertical = this.setVertical.bind(this);
    this.handleSwitchPoles = this.handleSwitchPoles.bind(this);
    this.handleSwitchPlanes = this.handleSwitchPlanes.bind(this);
    this.state = { drawPlanes: true, drawPoles: false, center: [0, 0] };
  }
  render() {
    const { drawPlanes, drawPoles, center } = this.state;

    return h("div.stereonet-outer", [
      h(StereonetComponent, {
        drawPlanes,
        drawPoles,
        ...this.props,
        center,
        ref: "component",
      }),
      h(Card, { className: "controls" }, [
        h(Switch, {
          checked: drawPlanes,
          onChange: this.handleSwitchPlanes,
          label: "Planes",
        }),
        h(Switch, {
          checked: drawPoles,
          onChange: this.handleSwitchPoles,
          label: "Poles",
        }),
        h(
          Button,
          { onClick: this.setVertical.bind(this), className: "bp3-small" },
          "Vertical"
        ),
      ]),
    ]);
  }

  setVertical() {
    this.setState({ center: [0, -90] });
    return console.log("Want to set vertical");
  }

  handleSwitchPoles() {
    return this.setState({ drawPoles: !this.state.drawPoles });
  }
  handleSwitchPlanes() {
    return this.setState({ drawPlanes: !this.state.drawPlanes });
  }
}

export { StereonetComponent, InteractiveStereonetComponent };
