import * as d3 from "d3";
import { Shapes, Intersection } from "kld-intersections";
import { PathParser } from "kld-path-parser";
import PathHandler from "kld-intersections/lib/PathHandler";

const index = { lon: 0, lat: 1 };

const formatAzimuthLabel = function (d) {
  const v = 180 - d.value;
  if (v === 180) {
    return "S";
  }
  if (v === 90) {
    return "E";
  }
  if (v === 0) {
    return "N";
  }
  if (v === 270) {
    return "W";
  }
  return `${v}°`;
};

class GraticuleLabels {
  static initClass() {
    this.prototype.type = "lat";
    this.prototype.showCircles = false;
    this.prototype._offs = [0, 0];
    this.prototype._rot = 0;
    this.prototype.labelText = "Latitude";
  }
  constructor(stereonet) {
    this.stereonet = stereonet;
  }
  format(d) {
    return `${d.value}°`;
  }
  alongLine(startPos, endPos) {
    this.shape = Shapes.line(...startPos, ...endPos);
    return this;
  }

  textOffset(offs) {
    if (offs == null) {
      return this._offs;
    }
    this._offs = offs;
    return this;
  }

  textRotation(rot) {
    if (rot == null) {
      return this._rot;
    }
    this._rot = rot;
    return this;
  }

  getIntersections() {
    const { coordinates, type } = this.stereonet.graticule()();
    const pth = d3.geoPath(this.stereonet.projection());
    const ix = index[this.type];
    const intersections = [];
    const values = coordinates.filter((d) => d[0][ix] === d[1][ix]);
    for (let coords of Array.from(values)) {
      const obj = { type: "LineString", coordinates: coords };
      const d = pth(obj);
      const parser = new PathParser();
      const handler = new PathHandler();
      parser.setHandler(handler);
      try {
        parser.parseData(d);
      } catch (error) {
        continue;
      }
      const path = Shapes.path(handler.shapes);
      const { points } = Intersection.intersect(path, this.shape);
      for (let point of Array.from(points)) {
        point.value = coords[0][ix];
        intersections.push(point);
      }
    }
    return intersections;
  }

  render(el) {
    this.container = el.append("g").attr("class", "labels");

    const sel = this.container
      .selectAll("g.label")
      .data(this.getIntersections())
      .enter()
      .append("g")
      .attr("class", "label")
      .attr("transform", (d) => `translate(${d.x},${d.y})`)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle");

    sel
      .append("text")
      .text(this.format)
      .attr(
        "transform",
        `translate(${this._offs[0]},${this._offs[1]}) rotate(${this._rot})`
      );

    if (this.showCircles) {
      sel.append("circle").attr("r", 2);
    }

    return sel;
  }

  renderLabel(pos) {
    if (pos == null) {
      pos = [0, 0];
    }
    return this.container
      .append("text")
      .attr("class", "axis-label")
      .attr("transform", `translate(${pos[0]}, ${pos[1]}) rotate(${this._rot})`)
      .attr("text-anchor", "middle")
      .text(this.labelText);
  }
}
GraticuleLabels.initClass();

class AzimuthLabels extends GraticuleLabels {
  static initClass() {
    this.prototype.type = "lon";
    this.prototype.labelText = "Dip azimuth";
    this.prototype.format = formatAzimuthLabel;
  }
}
AzimuthLabels.initClass();

class DipLabels extends GraticuleLabels {
  static initClass() {
    this.prototype.type = "lat";
    this.prototype.labelText = "Dip";
  }
  format(d) {
    const v = 90 - d.value;
    return `${v}°`;
  }
}
DipLabels.initClass();

export { GraticuleLabels, AzimuthLabels, DipLabels };
