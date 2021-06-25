/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import React from "react";
import ReactDOM from "react-dom";
import h from "react-hyperscript";
import * as M from "mathjs";

import * as d3 from "d3";
import { opacityByCertainty, chroma } from "@attitude/core/src";
import {
  hyperbolicErrors,
  apparentDip,
  digitizedLine,
  PlaneData,
  fixAngle,
} from "@attitude/core/src";
import { computeCentroidExtrema } from "@attitude/core/src/util";

const darkenColor = (c) => chroma(c).darken(2).css();

const fmt = d3.format(".0f");

class SideViewComponent extends React.Component {
  static initClass() {
    this.defaultProps = {
      hovered: [{ uid: "" }],
    };
  }
  constructor(props) {
    super(props);
  }
  componentDidMount() {
    let x, y;
    const { data } = this.props;

    for (let f of Array.from(data)) {
      f.is_group = f.members != null;
    }

    this.singlePlanes = data
      .filter((d) => !d.is_group)
      .map((d) => new PlaneData(d));

    const overallCenter = computeCentroidExtrema(this.singlePlanes);

    let xsize = 0;
    let ysize = 0;

    for (var p of Array.from(this.singlePlanes)) {
      let z;
      p.offset = M.subtract(p.mean, overallCenter);
      [x, y, z] = M.abs(p.offset);
      if (z > ysize) {
        ysize = z;
      }
      const hyp = Math.hypot(x, y);
      if (hyp > xsize) {
        xsize = h;
      }

      p.inGroup = false;
      if (p.data.member_of != null) {
        const group = data.find((d) => d.uid === p.data.member_of);
        if (group != null) {
          p.group = new PlaneData(group, p.mean);
          p.group.offset = p.offset;
          p.inGroup = true;
        }
      }
    }

    xsize *= 1.1;
    ysize *= 1.1;
    console.log(xsize, ysize);

    const margin = 30;
    const marginLeft = 50;
    const marginRight = 100;
    const marginTop = 5;
    const marginBottom = 35;
    const sz = { width: 800, height: 300 };
    const innerSize = {
      width: sz.width - marginLeft - marginRight,
      height: sz.height - marginTop - marginBottom,
    };

    this.svg = d3
      .select(ReactDOM.findDOMNode(this))
      .at(sz)
      .append("g")
      .at({ transform: `translate(${marginLeft},${marginTop})` });

    x = d3.scaleLinear().range([0, innerSize.width]).domain([-xsize, xsize]);

    y = d3.scaleLinear().range([innerSize.height, 0]).domain([-ysize, ysize]);

    const dataArea = this.svg.append("g.data");

    /* Setup data */

    this.errorContainer = dataArea.append("g.errors");
    this.errorContainerGrouped = dataArea.append("g.errors-grouped");
    this.planeContainer = dataArea.append("g.planes");

    const setScale = function (scale, mPerPx) {
      const r = scale.range();
      const w = r[1] - r[0];
      const mWidth = Math.abs(w * mPerPx);
      return scale.domain([-mWidth / 2, mWidth / 2]);
    };

    // For 1:1
    const yRatio = Math.abs(1 / (y(1) - y(0)));
    const xRatio = Math.abs(1 / (x(1) - x(0)));

    if (xRatio > yRatio) {
      setScale(y, xRatio);
    } else {
      setScale(x, yRatio);
    }

    this.lineGenerator = d3
      .line()
      .x((d) => x(d[0]))
      .y((d) => y(d[1]));

    /* Setup axes */
    const axes = this.svg.append("g.axes");

    const yA = d3
      .scaleLinear()
      .domain(y.domain().map((d) => d + overallCenter[2]))
      .range(y.range());

    const yAx = d3.axisLeft(yA).tickFormat(fmt).tickSizeOuter(0);

    axes
      .append("g.y.axis")
      .call(yAx)
      .append("text.axis-label")
      .text("Elevation (m)")
      .attr("transform", `translate(-40,${innerSize.height / 2}) rotate(-90)`)
      .style("text-anchor", "middle");

    const __domain = x.domain();
    const __dw = __domain[1] - __domain[0];

    const xA = d3.scaleLinear().domain([0, __dw]).range(x.range());

    const xAx = d3.axisBottom(xA).tickFormat(fmt).tickSizeOuter(0);

    const _x = axes
      .append("g.x.axis")
      .translate([0, innerSize.height])
      .call(xAx);

    this.azLabel = _x
      .append("text.axis-label")
      .attr("transform", `translate(${innerSize.width / 2},24)`)
      .style("text-anchor", "middle");

    this.scales = { x, y };

    return this.componentDidUpdate();
  }

  componentDidUpdate(prevProps) {
    if (prevProps == null) {
      prevProps = {};
    }
    if (prevProps.azimuth !== this.props.azimuth) {
      this.updateAzimuth();
    }
    if (prevProps.hovered !== this.props.hovered) {
      return this.updateHovered();
    }
  }

  updateAzimuth() {
    console.log("Updated constraints");
    const angle = this.props.azimuth - Math.PI / 2;
    const { x, y } = this.scales;

    const v_ = M.eye(3).toArray();
    const hyp = hyperbolicErrors(angle, v_, x, y).width(150).nominal(false);

    if (!this.svg.select("#gradient").node()) {
      this.errorContainer.call(hyp.setupGradient);
    }

    // Individual data
    //# We have some problems showing large error angles
    let sel = this.errorContainer
      .selectAll("g.error-hyperbola")
      .data(this.singlePlanes);

    let esel = sel
      .enter()
      .append("g.error-hyperbola")
      .classed("in-group", (d) => d.group != null);

    esel
      .merge(sel)
      .each(hyp)
      .sort((a, b) => a.__z - b.__z);

    // Grouped data
    const gp = this.singlePlanes
      .filter((d) => d.group != null)
      .map((d) => d.group);

    sel = this.errorContainerGrouped.selectAll("g.error-hyperbola").data(gp);
    esel = sel.enter().append("g.error-hyperbola");
    esel
      .merge(sel)
      .each(hyp)
      .sort((a, b) => a.__z - b.__z);

    const dataWithTraces = this.singlePlanes.filter((d) => d.centered != null);
    const se = this.planeContainer.selectAll("path.trace").data(dataWithTraces);

    const { onHover } = this.props;
    const ese = se
      .enter()
      .append("path.trace")
      .attr("stroke", (d) => darkenColor(d.color))
      .on("mouseover", (d) => onHover(d.data));

    //df = digitizedLine(angle, @lineGenerator)
    const df = apparentDip(angle, x, y);
    ese.merge(se).each(df);

    const az = fmt((fixAngle(angle + Math.PI) * 180) / Math.PI);
    return this.azLabel.text(`Distance along ${az}º`);
  }

  updateHovered() {
    const { hovered } = this.props;
    if (hovered == null) {
      return;
    }
    const hoveredIDs = hovered.map((d) => d.uid);
    return this.planeContainer
      .selectAll("path.trace")
      .attr("stroke", function (v) {
        let c = darkenColor(v.color);
        if (hoveredIDs.indexOf(v.data.uid) !== -1) {
          c = v.color;
        }
        return c;
      });
  }

  render() {
    return h("svg.horizontal-area");
  }
}
SideViewComponent.initClass();

export { SideViewComponent };
