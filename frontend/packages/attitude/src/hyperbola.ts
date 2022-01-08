/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import M from "mathjs";
import Q from "quaternion";
import { mean } from "d3-array";
import { line } from "d3-shape";
import * as d3 from "d3";
import "d3-jetpack";
import { select } from "./selection";
import chroma from "chroma-js";
import * as math from "./math";
import { opacityByCertainty } from "./stereonet";
import uuid from "uuid";

//# Matrix to map down to 2 dimensions
let T = M.matrix([
  [1, 0],
  [0, 0],
  [0, 1],
]);

const fixAngle = function (a) {
  // Put an angle on the interval [-Pi,Pi]
  while (a > Math.PI) {
    a -= 2 * Math.PI;
  }
  while (a < -Math.PI) {
    a += 2 * Math.PI;
  }
  return a;
};

const matrix = function (obj) {
  if (obj instanceof Q) {
    //# We're dealing with a quaternion,
    // need to convert to rotation matrix
    obj = obj.toMatrix(true);
  }
  return M.matrix(obj);
};

const dot = (
  ...args // Multiply matrices, ensuring matrix form
) => M.multiply(...args.map(matrix));

const transpose = (m) => M.transpose(matrix(m));

const vecAngle = function (a0, a1) {
  const a0_ = M.divide(a0, M.norm(a0));
  const a1_ = M.divide(a1, M.norm(a1));
  return dot(a0_, a1_);
};

const apparentDipCorrection = function (screenRatio) {
  if (screenRatio == null) {
    screenRatio = 1;
  }
  return function (axes2d) {
    // Correct for apparent dip
    const a0 = axes2d[1];
    const a1 = [0, 1];
    //a0 = M.divide(a0,M.norm(a0))
    //a1 = M.divide(a1,M.norm(a1))
    const cosA = dot(a0, a1);
    console.log("Axes", a0, cosA);
    const angle = Math.atan2(
      Math.tan(Math.acos(cosA / (M.norm(a0) * M.norm(a1)))),
      screenRatio
    );
    return (angle * 180) / Math.PI;
  };
};

const scaleRatio = (scale) => scale(1) - scale(0);

const getRatios = function (x, y) {
  // Ratios for x and y axes
  const ratioX = scaleRatio(x);
  const ratioY = scaleRatio(y);
  const screenRatio = ratioX / ratioY;

  const lineGenerator = line()
    .x((d) => d[0] * ratioX)
    .y((d) => d[1] * ratioY);

  return { ratioX, ratioY, screenRatio, lineGenerator };
};

const __planeAngle = function (axes, angle) {
  // Get angle of the plane from the major axes
  const a0 = axes.toArray()[0];
  return angle - M.acos(vecAngle([a0[0], a0[1], 0], [1, 0, 0]));
};

const createTransform = function (
  viewpoint,
  xScale,
  yScale,
  screenRatio = null
) {
  if (screenRatio == null) {
    ({ screenRatio } = getRatios(xScale, yScale));
  }

  //if not axes?
  const f = function (d) {
    //select @
    //.attr 'd',lineGenerator(lineData)
    //.attr 'transform', "translate(#{xScale(offs[0])},#{yScale(offs[2])})rotate(#{v})"

    let plane = d;
    if (d.group != null) {
      plane = d.group;
    }
    /* Create a line from input points */
    /* Put in axis-aligned coordinates */
    const q = Q.fromAxisAngle([0, 0, 1], viewpoint);
    // Get offset of angles
    const offs = dot(d.offset, q, T).toArray();

    let v = plane.apparentDip(-viewpoint + Math.PI / 2);
    v = (-Math.atan2(Math.tan(v), screenRatio) * 180) / Math.PI;

    return `translate(${xScale(offs[0])},${yScale(offs[1])}) rotate(${v})`;
  };

  return f;
};

const hyperbolicErrors = function (viewpoint, axes, xScale, yScale) {
  // Viewpoint should be an angle from north in radians
  const n = 10;
  const angle = viewpoint;
  const gradient = null;
  let __width = 400;
  let nominal = false;
  const centerPoint = false;
  let alphaScale = null;
  // Whether to exaggerate error angles along with scale
  let scaleErrorAngles = true;
  const __hideIfErrorsTooLarge = false;
  const __showError = true;

  // For 3 coordinates on each half of the hyperbola, we collapse down to
  // a special case where no trigonometry outside of tangents have to be calculated
  // at each step. This is much more efficient, at the cost of the fine structure
  // of the hyperbola near the origin
  const nCoords = 3;
  let { ratioX, ratioY, screenRatio, lineGenerator } = getRatios(
    xScale,
    yScale
  );

  const dfunc = function (d) {
    // Get a single level of planar errors (or the
    // plane's nominal value) as a girdle
    let arr, cutAngle2, hyp, loc, translate, zind;
    const width = __width;

    let rax = d.axes;
    if (rax[2][2] < 0) {
      rax = rax.map((row) => row.map((i) => -i));
    }

    const q = Q.fromAxisAngle([0, 0, 1], angle + Math.PI);

    const R = matrix(axes);
    const ax = dot(M.transpose(R), d.axes, R);
    const a1 = __planeAngle(ax, angle);

    //# Matrix to map down to 2 dimensions
    T = M.matrix([
      [1, 0],
      [0, 0],
      [0, 1],
    ]);

    /* Project axes to 2d */
    const s = M.sqrt(d.lengths).map((d) => 1 / d);
    let v = [s[0] * Math.cos(a1), s[1] * Math.sin(a1), s[2]];
    const a = 1 / M.norm([v[0], v[1]]);
    const b = 1 / M.abs(v[2]);

    //a = M.norm([e[0],e[1]])
    //b = e[2]

    // Major axes of the conic sliced in the requested viewing
    // geometry
    // Semiaxes of hyperbola
    const cutAngle = Math.atan2(b, a);
    const angularError = (cutAngle * 2 * 180) / Math.PI;
    if (angularError > 90 && __hideIfErrorsTooLarge) {
      //# This plane has undefined errors
      hyp = select(this).attr("visibility", "hidden");
      return;
    }

    // find length at which tangent is x long
    const lengthShown = width / 2;

    if (scaleErrorAngles) {
      cutAngle2 = Math.atan2(b, a * screenRatio);
    } else {
      cutAngle2 = cutAngle;
    }
    const inPlaneLength = lengthShown * Math.cos(cutAngle2);

    //# We will transform with svg functions
    //# so we can neglect some of the math
    // for hyperbolae not aligned with the
    // coordinate plane.
    if (nCoords > 3) {
      const angles = __range__(0, n, false).map(
        (d) => cutAngle + (d / n) * (Math.PI - cutAngle) + Math.PI / 2
      );

      arr = transpose([
        M.multiply(M.tan(angles), a),
        M.cos(angles).map((v) => b / v),
      ]);
    } else {
      arr = [[0, b]];
    }

    const largeNumber = width / ratioX;
    const limit = (b / a) * largeNumber;

    const coords = [[-largeNumber, limit], ...arr, [largeNumber, limit]];

    // Correction for angle and means go here
    // unless managed by SVG transforms
    const top = coords.map(([x, y]) => [x, -y]);
    top.reverse();

    const poly = coords.concat(top);

    // Translate
    if (d.offset == null) {
      d.offset = [0, 0, 0];
    }
    if (d.offset.length === 3) {
      const offs = dot(d.offset, R, q).toArray();
      zind = offs[1];
      loc = [offs[0], offs[2]];
      const center = [xScale(loc[0]) - xScale(0), yScale(loc[1]) - yScale(0)];
      translate = [-center[0] + xScale(0), yScale(0) + center[1]];
    } else {
      loc = d.offset;
      zind = 1;
      translate = [xScale(loc[0]), yScale(loc[1])];
    }
    // Used for positioning, but later
    d.__z = zind;

    const oa = opacityByCertainty(() => d.color)
      .angularError(() => angularError)
      .max(5);

    if (alphaScale != null) {
      oa.alphaScale(alphaScale);
    }

    // Correct for apparent dip
    //apparent = apparentDipCorrection(screenRatio)

    // grouped transform
    v = d.apparentDip(-angle + Math.PI / 2);
    v = (-Math.atan2(Math.tan(v), screenRatio) * 180) / Math.PI;
    //if aT[1][0]*aT[1][1] < 0
    //__angle *= -1
    //console.log 'Angle', __angle
    //__angle = 0

    if (!scaleErrorAngles) {
      lineGenerator = line()
        .x((d) => d[0] * ratioX)
        .y((d) => d[1] * ratioX);
    }

    //# Start DOM manipulation ###
    hyp = select(this)
      .attr("visibility", "visible")
      .attr(
        "transform",
        `translate(${translate[0]},${translate[1]}) \
rotate(${v})`
      );

    hyp.classed("in_group", d.inGroup);

    let lim = width / 2;
    lim = Math.abs(inPlaneLength);
    const masksz = { x: -lim, y: -lim, width: lim * 2, height: lim * 2 };

    let mask = hyp.select("mask");
    let mid = null;
    if (!mask.node()) {
      mid = uuid.v4();
      mask = hyp
        .append("mask")
        .attr("id", mid)
        .attrs(masksz)
        .append("rect")
        .attrs({ ...masksz, fill: "url(#gradient)" });
    }
    if (mid == null) {
      mid = mask.attr("id");
    }

    if (centerPoint) {
      hyp.selectAppend("circle").attrs({ r: 2, fill: "black" });
    }

    hyp
      .selectAppend("path.hyperbola")
      .datum(poly)
      .attr("d", (v) => lineGenerator(v) + "Z")
      .each(oa)
      .attr("mask", `url(#${mid})`);

    if (nominal) {
      return hyp
        .selectAppend("line.nominal")
        .attrs({ x1: -largeNumber, x2: largeNumber })
        .attr("stroke", (d) => d.color)
        .attr("mask", `url(#${mid})`);
    }
  };

  dfunc.setupGradient = function (el) {
    const defs = el.append("defs");

    const g = defs.append("linearGradient").attr("id", "gradient");

    const stop = function (ofs, op) {
      const a = Math.round(op * 255);
      return g.append("stop").attrs({
        offset: ofs,
        "stop-color": `rgb(${a},${a},${a})`,
        "stop-opacity": op,
      });
    };

    stop(0, 0);
    stop(0.2, 0.1);
    stop(0.45, 1);
    stop(0.55, 1);
    stop(0.8, 0.1);
    return stop(1, 0);
  };

  dfunc.scaleErrorAngles = function (o) {
    if (o == null) {
      return scaleErrorAngles;
    }
    scaleErrorAngles = o;
    return dfunc;
  };

  dfunc.width = function (o) {
    if (o == null) {
      return __width;
    }
    __width = o;
    return dfunc;
  };

  dfunc.nominal = function (o) {
    if (o == null) {
      return nominal;
    }
    nominal = o;
    return dfunc;
  };

  dfunc.alphaScale = function (o) {
    if (o == null) {
      return alphaScale;
    }
    alphaScale = o;
    return dfunc;
  };

  return dfunc;
};

const digitizedLine = function (viewpoint, lineGenerator) {
  let axes = M.eye(3);
  const f = function (d) {
    /* Create a line from input points */
    /* Put in axis-aligned coordinates */
    const q = Q.fromAxisAngle([0, 0, 1], viewpoint);
    const R = M.transpose(matrix(axes));
    const alignedWithGroup = dot(d.centered, R);
    const offs = dot(d.offset, R);
    const v = alignedWithGroup.toArray().map((row) => M.add(row, offs));
    const a = dot(v, q);
    /* Map down to two dimensions (the x-z plane of the viewing geometry) */
    const data = dot(a, T).toArray();

    return select(this).attr("d", lineGenerator(data));
  };

  f.axes = function (o) {
    if (o == null) {
      return axes;
    }
    axes = o;
    return f;
  };

  return f;
};

const apparentDip = function (viewpoint, xScale, yScale) {
  let axes = M.eye(3);
  let width = 400;
  const { ratioX, ratioY, screenRatio, lineGenerator } = getRatios(
    xScale,
    yScale
  );

  const transformer = createTransform(viewpoint, xScale, yScale, screenRatio);

  //if not axes?
  const f = function (d) {
    //select @
    //.attr 'd',lineGenerator(lineData)
    //.attr 'transform', "translate(#{xScale(offs[0])},#{yScale(offs[2])})rotate(#{v})"

    let plane = d;
    if (d.group != null) {
      plane = d.group;
    }
    /* Create a line from input points */
    /* Put in axis-aligned coordinates */
    const q = Q.fromAxisAngle([0, 0, 1], viewpoint);

    const cv = Math.cos(viewpoint);
    const sv = Math.sin(viewpoint);
    const Ra = matrix([
      [cv, -sv, 0],
      [sv, cv, 0],
      [0, 0, 1],
    ]);
    const A = matrix(plane.axes);

    const el = select(this);
    if (this.tagName === "path") {
      const _d0 = dot(d.centered, M.transpose(A), Ra);
      /* Map down to two dimensions (the x-z plane of the viewing geometry) */
      const data = dot(_d0, T).toArray();
      el.attr("d", lineGenerator(data));
    } else if (this.tagName === "line") {
      el.attr("x1", -width / 2);
      el.attr("x2", width / 2);
    }
    return el.attr("transform", transformer(d));
  };

  f.axes = function (o) {
    if (o == null) {
      return axes;
    }
    axes = o;
    return f;
  };

  f.width = function (o) {
    if (o == null) {
      return width;
    }
    width = o;
    return f;
  };

  return f;
};

class PlaneData {
  constructor(data, mean = null) {
    this.dip = this.dip.bind(this);
    this.apparentDip = this.apparentDip.bind(this);
    const { axes, hyperbolic_axes, extracted, color } = data;
    this.mean = mean || data.mean || data.center;
    this.axes = data.axes;
    this.color = color;
    this.lengths = hyperbolic_axes;
    this.inGroup = data.in_group;
    this.array = extracted;
    this.data = data;
    this.centered = data.centered_array;

    // If we didn't pass a mean, we have to compute one
    if (this.array == null) {
      return;
    }
    //# Extract mean of data on each axis ##
    if (this.mean == null) {
      this.mean = [0, 1, 2].map((i) => mean(this.array, (d) => d[i]));
    }
    if (this.centered == null) {
      this.centered = this.array.map((d) => M.subtract(d, this.mean));
    }
  }

  dip() {
    const n = this.axes[2];
    const r = M.norm(n);
    const dip = M.acos(n[2] / r);
    const dipDr = fixAngle(Math.atan2(n[0], n[1]));
    return [dip, dipDr];
  }

  apparentDip(azimuth) {
    const n = this.axes[2];
    const r = M.norm(n);
    let [dip, dipDr] = this.dip();
    dipDr = Math.atan2(n[0], n[1]);
    const a = fixAngle(azimuth - dipDr);
    const sign = -Math.PI / 2 < a || Math.PI / 2 > a ? 1 : -1;
    const d = M.tan(dip) * M.cos(azimuth - dipDr);
    return sign * Math.atan(d);
  }
}

export {
  hyperbolicErrors,
  digitizedLine,
  PlaneData,
  fixAngle,
  apparentDip,
  dot,
  chroma,
  createTransform,
};

function __range__(left, right, inclusive) {
  let range = [];
  let ascending = left < right;
  let end = !inclusive ? right : ascending ? right + 1 : right - 1;
  for (let i = left; ascending ? i < end : i > end; ascending ? i++ : i--) {
    range.push(i);
  }
  return range;
}
