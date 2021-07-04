/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import * as d3 from "d3";
import chroma, { Color } from "chroma-js";
import { select } from "../selection";
import * as functions from "../functions";
import * as math from "../math";
import "./style.styl";
import horizontal from "./horizontal";
import vertical from "./vertical";
import interaction from "./interaction";
import { globalLabels } from "./labels";
import uuid from "uuid";

export { selection };

const opts = {
  degrees: true,
  traditionalLayout: false,
  adaptive: false,
  n: 200, // Bug if we go over 60?
  level: 1, // 95% ci for 3 degrees of freedom
};

const getterSetter = (main) =>
  function (p, fn) {
    // A generic wrapper
    // to get/set variables
    if (fn == null) {
      fn = (v) => (p = v);
    }
    return function () {
      if (arguments.length > 0) {
        fn(...arguments);
        return main;
      } else {
        return p();
      }
    };
  };

function Stereonet(o1 = {}) {
  const { interactive = true } = o1;
  const planes = null;
  const ellipses = null;
  let data = null;
  let el = null;
  let dataArea = null;
  let overlay = null;
  let margin = 20;
  let scale = 300;
  let clipAngle = 90;
  let s = 0.00001;
  let shouldClip = true;
  let __overrideNeatlineClip = false;
  const uid = uuid.v4();

  let graticule = d3
    .geoGraticule()
    .stepMinor([10, 10])
    .stepMajor([90, 10])
    .extentMinor([
      [-180, -80 - s],
      [180, 80 + s],
    ])
    .extentMajor([
      [-180, -90 + s],
      [180, 90 - s],
    ]);

  const proj = d3
    .geoAzimuthalEqualArea()
    .clipAngle(clipAngle)
    .precision(0.01)
    .rotate([0, 0])
    .scale(300);

  let path = d3.geoPath().projection(proj).pointRadius(2);

  // Items to be added once DOM is available
  // (e.g. interaction)
  const callStack = [];

  const drawPlanes = function (data, o) {
    if (o == null) {
      o = {};
    }
    if (o.color == null) {
      o.color = "#aaaaaa";
    }
    if (el == null) {
      throw "Stereonet must be initialized to an element before adding data";
    }
    if (o.selector == null) {
      o.selector = "g.planes";
    }

    const con = dataArea.selectAppend(o.selector);

    const fn = functions.plane(opts);

    const sel = con
      .selectAll("g.plane")
      .data(data)
      .enter()
      .append("g")
      .classed("plane", true)
      .each(fn)
      .each(function (d) {
        let color;
        if (typeof o.color === "function") {
          color = o.color(d);
        } else {
          ({ color } = o);
        }
        const e = select(this);
        e.selectAll("path.error").attrs({ fill: color });
        return e
          .selectAll("path.nominal")
          .attrs({ stroke: chroma(color).darken(0.2).css() });
      });

    __redraw();
    return sel;
  };

  const drawEllipses = function (data, o = {}) {
    o.color ??= (d) => d.color || "#aaaaaa";
    if (el == null) {
      throw "Stereonet must be initialized to an element before adding data";
    }

    o.selector ??= "g.poles";

    const con = dataArea.selectAppend(o.selector);

    const o1 = { ...opts, ...o };

    const fn = functions.errorEllipse(o1);

    const createEllipse = function (d) {
      console.log(d);
      return select(this).append("path").attr("class", "error").datum(fn(d));
    };

    const sel = con
      .selectAll("g.normal")
      .data(data)
      .enter()
      .append("g")
      .classed("normal", true)
      .each(createEllipse);

    sel.each(function (d) {
      let color, e;
      if (typeof o.color === "function") {
        color = o.color(d);
      } else {
        ({ color } = o);
      }
      return (e = select(this).selectAll("path.error").attrs({ fill: color }));
    });
    __redraw();
    return sel;
  };

  const __setScale = function (n) {
    // Scale the stereonet to an appropriate size
    if (n != null) {
      scale = n;
    }
    let radius = scale / 2 - margin;

    // The below is a bona-fide hack!
    if (clipAngle === 90) {
      radius = scale / 2.5 - margin;
    }

    if (clipAngle < 89) {
      const _pscale = radius / Math.sin((Math.PI / 180) * clipAngle);
      if (shouldClip) {
        proj.clipAngle(clipAngle);
      }
      proj.scale(_pscale).translate([scale / 2, scale / 2]);
    } else {
      proj.scale(radius).translate([scale / 2, scale / 2]);
    }

    path = d3.geoPath().projection(proj);

    if (el != null) {
      el.attr("height", scale);
      return el.attr("width", scale);
    }
  };

  const __setScaleOnly = (n) => proj.scale(n);

  var __redraw = () => {
    if (el == null) {
      return;
    }
    return el.selectAll("path").attr("d", path.pointRadius(2));
  };

  const dispatch = d3.dispatch(uid + "rotate", uid + "redraw");

  let __createNeatline = (sel, neatlineId) =>
    sel
      .append("path")
      .datum({ type: "Sphere" })
      .attr("d", path)
      .attr("id", neatlineId.slice(1))
      .attr("fill", "transparent");

  const f = function (_el, opts) {
    // This should be integrated into a reusable
    // component
    if (opts == null) {
      opts = {};
    }
    el = select(_el.node());

    __setScale(); // Scale the stereonet

    const sphereId = `#${uid}-sphere`;

    const defs = el.append("defs");

    defs.call(__createNeatline, sphereId);

    const neatlineId = `#${uid}-neatline-clip`;
    defs
      .append("clipPath")
      .attr("id", neatlineId.slice(1))
      .append("use")
      .attr("xlink:href", sphereId);

    el.append("use")
      .attr("class", "background")
      .attr("xlink:href", sphereId)
      .attr("fill", "white")
      .attr("stroke", "#aaaaaa");

    const int = el.append("g").attr("class", "interior");

    int
      .append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);

    dataArea = int.append("g").attr("class", "data");

    // This is a bit of a hack
    if (shouldClip || __overrideNeatlineClip) {
      el.append("use").attr("class", "neatline").attr("xlink:href", sphereId);

      int.attr("clip-path", `url(${neatlineId})`);
    }

    overlay = el.append("g").attr("class", "overlay");

    for (let item of Array.from(callStack)) {
      item();
    }
    // Finally, draw all the paths at once
    return __redraw();
  };

  let __getSet = getterSetter(f);
  // Getter-setter for data
  f.data = __getSet(
    () => data,
    (o) => {
      return (data = o);
    }
  );
  f.node = () => el;
  f.margin = __getSet(
    () => margin,
    (o) => {
      return (margin = o);
    }
  );
  f.size = __getSet(() => scale, __setScale);
  f.scale = __getSet(() => scale, __setScaleOnly);
  f.innerSize = () => scale - margin;
  f.projection = () => proj;
  f.clip = __getSet(
    () => shouldClip,
    (c) => (shouldClip = c)
  );

  f.uid = () => uid;

  f.refresh = () => __redraw();
  f.rotate = (coords) => {
    if (coords == null) {
      return proj.rotate();
    }
    proj.rotate(coords);
    dispatch.call(uid + "rotate", f);
    return __redraw();
  };

  f.centerPosition = function () {
    let centerPos;
    return (centerPos = proj.invert([scale / 2, scale / 2]));
  };

  f.d3 = d3;

  f.on = (event, callback) => dispatch.on(uid + event, callback);

  f.rectangular = function (opts: any = {}) {
    let {
      width = scale - 2 * margin,
      height = scale - 2 * margin,
      x = margin,
      y = margin,
    } = opts;
    // Create a rectangular neatline
    __createNeatline = function (sel, id) {
      const rect = sel.append("rect");

      const object = {
        id: id.slice(1),
        width,
        height,
        x,
        y,
      };
      for (let k in object) {
        const v = object[k];
        rect.attr(k, v);
      }
      proj.clipAngle(90).translate([width / 2 + margin, height / 2 + margin]);
      __overrideNeatlineClip = true;
    };
    return f;
  };

  const setGraticule = function (lon, lat) {
    //# Could also make this take a d3.geoGraticule object ##
    s = 0.00001;
    return (graticule = d3
      .geoGraticule()
      .stepMinor([lon, lat])
      .stepMajor([90, lat])
      .extentMinor([
        [-180, -90 + lat - s],
        [180, 90 - lat + s],
      ])
      .extentMajor([
        [-180, -90 + s],
        [180, 90 - s],
      ]));
  };

  f.graticule = __getSet(() => graticule, setGraticule);

  let _ = function (c) {
    if (c === "vertical") {
      c = [0, 90];
    }
    proj.rotate(c);
    if (el != null) {
      return __redraw();
    }
  };
  f.center = __getSet(() => proj.rotate, _);

  _ = function (c) {
    clipAngle = c;
    proj.rotate([0, -90]);
    __setScale();
    return f;
  };
  f.clipAngle = __getSet(() => clipAngle, _);
  f.planes = drawPlanes;
  f.draw = __redraw;

  f.path = () => path;

  f.call = function (fn, ...args) {
    const todo = () => fn(f, ...args);
    if (f.node() != null) {
      todo();
    } else {
      callStack.push(todo);
    }
    return f;
  };

  var ell = function () {
    // Same call signature as selection.data
    let attrs = null;
    let data_ = null;
    let sel = null;
    let fn = null;
    const o = function (el_) {
      ell = functions.errorEllipse(opts);
      sel = () => el_.selectAll("path.ellipse").data(data_.map(ell), fn);

      sel()
        .enter()
        .append("path")
        .attr("class", "ellipse")
        .attrs(attrs)
        .exit()
        .remove();

      if (el != null) {
        __redraw();
      }
      return sel;
    };

    __getSet = getterSetter(o);

    o.data = __getSet(data_, function (d, f) {
      data_ = d;
      return (fn = f);
    });

    o.attrs = __getSet(attrs, function (o) {
      attrs = o;
      if (sel != null) {
        return sel().attrs(attrs);
      }
    });

    o.selection = sel;
    return o;
  };

  f.ellipses = drawEllipses;
  f.dataArea = () => dataArea;
  f.overlay = () => overlay;
  f.horizontal = horizontal(f);
  f.vertical = vertical(f);

  if (interactive) {
    f.call(interaction);
  }

  return f;
}

function getColor(colorString: string): Color | null {
  try {
    return chroma(colorString);
  } catch (err) {
    return null;
  }
}

const opacityByCertainty = function (colorFunc, accessor = null) {
  let angularError = (d) => d.max_angular_error;
  const darkenStroke = 0.2;
  let maxOpacity = 5;
  let alphaScale = d3.scalePow(4).range([0.8, 0.1]).domain([0, maxOpacity]);
  alphaScale.clamp(true);
  const f = function (d, i) {
    const angError = angularError(d);
    const al = alphaScale(angError);

    const color = getColor(colorFunc(d)) ?? chroma("#aaaaaa");
    const fill = color.alpha(al).css();
    const stroke = color.alpha(al + darkenStroke).css();

    let e = select(this);
    if (accessor != null) {
      e = e.selectAll("path.error");
    }
    return e.attr("fill", fill).attr("stroke", stroke);
  };

  const __getSet = getterSetter(f);

  f.alphaScale = __getSet(alphaScale, (v) => (alphaScale = v));
  f.angularError = __getSet(angularError, (v) => (angularError = v));
  f.max = __getSet(maxOpacity, (v) => (maxOpacity = v));
  f.domain = __getSet(alphaScale.domain(), (v) => alphaScale.domain(v));

  return f;
};

export { globalLabels, Stereonet, opacityByCertainty, getColor };
