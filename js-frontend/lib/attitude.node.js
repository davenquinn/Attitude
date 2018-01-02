'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var d3$1 = require('d3');
var geojsonRewind = _interopDefault(require('geojson-rewind'));
var chroma = _interopDefault(require('chroma-js'));
require('d3-selection-multi');
var Q = _interopDefault(require('quaternion'));
var uuidNode = _interopDefault(require('uuid'));
var uuidShim = _interopDefault(require('js-uuid'));

var cart2sph;
var combinedErrors$1;
var convolveAxes;
var deconvolveAxes;
var ellipse;
var identity;
var norm;
var normalErrors;
var planeErrors;
var sdot;
var transpose;

transpose = function(array, length = null) {
  var i, j, k, l, m, newArray, ref, ref1, results;
  if (length == null) {
    length = array[0].length;
  }
  newArray = (function() {
    results = [];
    for (var k = 0; 0 <= length ? k < length : k > length; 0 <= length ? k++ : k--){ results.push(k); }
    return results;
  }).apply(this).map(function() {
    return [];
  });
  for (i = l = 0, ref = array.length; 0 <= ref ? l < ref : l > ref; i = 0 <= ref ? ++l : --l) {
    for (j = m = 0, ref1 = length; 0 <= ref1 ? m < ref1 : m > ref1; j = 0 <= ref1 ? ++m : --m) {
      newArray[j].push(array[i][j]);
    }
  }
  return newArray;
};

identity = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

norm = function(d) {
  var _;
  // L2 norm (hypotenuse)
  _ = d.map(function(a) {
    return a * a;
  });
  return Math.sqrt(d3$1.sum(_));
};

sdot = function(a, b) {
  var i, zipped;
  zipped = (function() {
    var k, ref, results;
    results = [];
    for (i = k = 0, ref = a.length; 0 <= ref ? k <= ref : k >= ref; i = 0 <= ref ? ++k : --k) {
      results.push(a[i] * b[i]);
    }
    return results;
  })();
  return d3$1.sum(zipped);
};

ellipse = function(opts) {
  var ell, ellAdaptive;
  // Basic function to create an array
  // of cosines and sines for error-ellipse
  // generation
  if (opts.n == null) {
    opts.n = 50;
  }
  if (opts.adaptive == null) {
    opts.adaptive = true;
  }
  ellAdaptive = function(a, b) {
    var angles, i, i_, k, l, ref, ref1, step, v;
    // Takes major, minor axis lengths
    i_ = 1;
    v = opts.n / 2;
    step = 2 / v;
    // Make a linearly varying space on the
    // interval [1,-1]
    angles = [];
    angles.push(Math.PI - Math.asin(i_));
    for (i = k = 0, ref = v; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
      i_ -= step;
      angles.push(Math.PI - Math.asin(i_));
    }
    for (i = l = 0, ref1 = v; 0 <= ref1 ? l < ref1 : l > ref1; i = 0 <= ref1 ? ++l : --l) {
      i_ += step;
      v = Math.asin(i_);
      if (v < 0) {
        v += 2 * Math.PI;
      }
      angles.push(v);
    }
    return (function() {
      var len, m, results;
      results = [];
      for (m = 0, len = angles.length; m < len; m++) {
        i = angles[m];
        results.push([b * Math.cos(i), a * Math.sin(i)]);
      }
      return results;
    })();
  };
  ell = function(a, b) {
    var angles, i, step;
    step = 2 * Math.PI / (opts.n - 1);
    angles = (function() {
      var k, ref, results;
      results = [];
      for (i = k = 0, ref = opts.n; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
        results.push(i * step);
      }
      return results;
    })();
    return (function() {
      var k, len, results;
      results = [];
      for (k = 0, len = angles.length; k < len; k++) {
        i = angles[k];
        // This reversal of B and A is causing tests to fail
        results.push([a * Math.cos(i), b * Math.sin(i)]);
      }
      return results;
    })();
  };
  if (opts.adaptive) {
    return ellAdaptive;
  } else {
    return ell;
  }
};

cart2sph = function(opts) {
  var c;
  if (opts.degrees == null) {
    opts.degrees = false;
  }
  c = opts.degrees ? 180 / Math.PI : 1;
  return function(d) {
    var r, x, y, z;
    r = norm(d);
    if (opts.traditionalLayout) {
      [y, z, x] = d;
    } else {
      [y, x, z] = d;
      x *= -1;
    }
    if (!opts.upperHemisphere) {
      z *= -1;
    }
    // Converts xyz to lat lon
    return [c * Math.atan2(y, x), c * Math.asin(z / r)];
  };
};

planeErrors = function(axesCovariance, axes, opts = {}) {
  var c1, ell, s, scales, sheet, stepFunc;
  // Get a single level of planar errors (or the
  // plane's nominal value) as a girdle
  if (opts.n == null) {
    opts.n = 100;
  }
  if (opts.upperHemisphere == null) {
    opts.upperHemisphere = true;
  }
  sheet = opts.sheet || 'nominal';
  if (axes == null) {
    axes = identity;
  }
  if (opts.traditionalLayout == null) {
    opts.traditionalLayout = true;
  }
  s = axesCovariance.map(Math.sqrt);
  axes = transpose(axes);
  scales = {
    upper: 1,
    lower: -1,
    nominal: 0
  };
  c1 = scales[sheet];
  if (opts.upperHemisphere) {
    c1 *= -1;
  }
  // Flip upper and lower rings
  if (axes[2][2] < 0) {
    c1 *= -1;
  }
  stepFunc = function(a) {
    var e, i, k, len, results;
    // Takes an array of [cos(a),sin(a)]
    e = [a[0], a[1], s[2] * c1];
    results = [];
    for (k = 0, len = axes.length; k < len; k++) {
      i = axes[k];
      results.push(sdot(e, i));
    }
    return results;
  };
  ell = ellipse(opts);
  return ell(s[0], s[1]).map(stepFunc).map(cart2sph(opts));
};

normalErrors = function(axesCovariance, axes, opts = {}) {
  var c1, ell, s, scales, stepFunc, v0;
  // Get a single level of planar errors (or the
  // plane's nominal value) as a girdle

  // Should use adaptive resampling
  // https://bl.ocks.org/mbostock/5699934
  if (opts.n == null) {
    opts.n = 100;
  }
  if (opts.upperHemisphere == null) {
    opts.upperHemisphere = true;
  }
  if (opts.traditionalLayout == null) {
    opts.traditionalLayout = true;
  }
  if (opts.sheet == null) {
    opts.sheet = 'upper';
  }
  if (axes == null) {
    axes = identity;
  }
  if (opts.level == null) {
    opts.level = 1;
  }
  scales = {
    upper: 1,
    lower: -1
  };
  s = axesCovariance.map(Math.sqrt);
  axes = transpose(axes);
  v0 = scales[opts.sheet];
  c1 = 1 * v0;
  if (opts.upperHemisphere) {
    c1 *= -1;
  }
  c1 *= opts.level;
  //if axes[2][2] < 0
  //  for i in [0..2]
  //    axes[i] = axes[i].map (d)->d*-1
  //  c1 *= -1
  stepFunc = function(es) {
    var e, i, k, len, results;
    e = es.map(function(d, i) {
      return -d * c1 * s[2] / s[i];
    });
    e.push(norm(es) * v0);
    results = [];
    for (k = 0, len = axes.length; k < len; k++) {
      i = axes[k];
      results.push(sdot(e, i));
    }
    return results;
  };
  ell = ellipse(opts);
  return ell(s[0], s[1]).map(stepFunc).map(cart2sph(opts));
};

combinedErrors$1 = function(sv, ax, opts = {}) {
  var func, out;
  func = function(type) {
    opts.sheet = type;
    opts.degrees = true;
    return planeErrors(sv, ax, opts);
  };
  return out = {
    nominal: func('nominal'),
    upper: func('upper'),
    lower: func('lower')
  };
};

convolveAxes = function(axes, sv) {
  var residual;
  // Convolve unit-length principal axes
  // with singular values to form vectors
  // representing the orientation and magnitude
  // of hyperbolic axes
  // In case we don't pass normalized axes
  [residual, axes] = deconvolveAxes(axes);
  return axes.map(function(row, i) {
    return row.map(function(e) {
      return e * sv[i];
    });
  });
};

deconvolveAxes = function(axes) {
  var ax, i, j, k, l, ref, ref1, sv;
  // Deconvolve unit-length principal axes and
  // singular values from premultiplied principal axes
  // Inverse of `convolveAxes`
  ax = transpose(axes);
  sv = ax.map(norm);
  for (i = k = 0, ref = axes.length; 0 <= ref ? k < ref : k > ref; i = 0 <= ref ? ++k : --k) {
    for (j = l = 0, ref1 = axes.length; 0 <= ref1 ? l < ref1 : l > ref1; j = 0 <= ref1 ? ++l : --l) {
      axes[j][i] /= sv[i];
    }
  }
  return [sv, axes];
};




var math = Object.freeze({
	get norm () { return norm; },
	get planeErrors () { return planeErrors; },
	get normalErrors () { return normalErrors; },
	get combinedErrors () { return combinedErrors$1; },
	get transpose () { return transpose; },
	get convolveAxes () { return convolveAxes; },
	get deconvolveAxes () { return deconvolveAxes; }
});

var cloneOptions;

cloneOptions = function(obj, newProps) {
  var a, k;
  a = {};
  for (k in obj) {
    a[k] = newProps[k] || obj[k];
  }
  return a;
};

var __createErrorEllipse;
var combinedErrors;
var createErrorEllipse;
var createErrorSurface;
var createFeature;
var createGroupedPlane;
var createNominalPlane;
var flipAxesIfNeeded;

combinedErrors = combinedErrors$1;

createFeature = function(type, coordinates) {
  return {
    type: 'Feature',
    geometry: {
      type: type,
      coordinates: coordinates
    }
  };
};

createErrorSurface = function(d, baseData = null) {
  var a, e, f;
  // Function that turns orientation
  // objects into error surface
  e = [d.lower, d.upper.reverse()];
  f = createFeature("Polygon", e);
  if (!d3.geoContains(f, d.nominal[0])) {
    f = createFeature("Polygon", e.map(function(d) {
      return d.reverse();
    }));
  }
  a = d3$1.geoArea(f);
  if (f.properties == null) {
    f.properties = {};
  }
  f.properties.area = a;
  if (baseData != null) {
    f.data = baseData;
  }
  return f;
};

createNominalPlane = function(d, baseData = null) {
  var obj;
  obj = createFeature('LineString', d.nominal);
  if (baseData != null) {
    obj.data = baseData;
  }
  return obj;
};

flipAxesIfNeeded = function(axes) {
  if (axes[2][2] < 0) {
    axes[2] = axes[2].map(function(e) {
      return -e;
    });
  }
  return axes;
};

createGroupedPlane = function(opts) {
  if (opts.nominal == null) {
    opts.nominal = true;
  }
  return function(p) {
    var axes, covariance, e, el, hyperbolic_axes;
    ({hyperbolic_axes, axes, covariance} = p);
    if (hyperbolic_axes == null) {
      // To preserve compatibility
      hyperbolic_axes = covariance;
    }
    // Make sure axes are not inverted
    axes = flipAxesIfNeeded(axes);
    e = combinedErrors(hyperbolic_axes, axes, opts);
    el = d3$1.select(this);
    el.append("path").datum(createErrorSurface(e, p)).attr('class', 'error').classed('unconstrained', hyperbolic_axes[2] > hyperbolic_axes[1]);
    if (!opts.nominal) {
      return;
    }
    // Create nominal plane
    return el.append("path").datum(createNominalPlane(e, p)).attr('class', 'nominal');
  };
};

__createErrorEllipse = function(opts) {
  var createEllipse;
  //Function generator to create error ellipse
  //for a single error level
  return createEllipse = function(p) {
    var axes, coords, covariance, f, f_, hyperbolic_axes, v;
    ({hyperbolic_axes, axes, covariance} = p);
    if (hyperbolic_axes == null) {
      // To preserve compatibility
      hyperbolic_axes = covariance;
    }
    f_ = function(sheet) {
      var a, e, f;
      opts.sheet = sheet;
      e = normalErrors(hyperbolic_axes, axes, opts);
      f = createFeature("Polygon", [e]);
      // Check winding (note: only an issue with non-traditional
      // stereonet axes)
      a = d3$1.geoArea(f);
      if (a > 2 * Math.PI) {
        f = createFeature("Polygon", [e.reverse()]);
        a = d3.geoArea(f);
      }
      f.properties = {
        area: a,
        level: opts.level,
        sheet: sheet
      };
      f.data = p;
      return f;
    };
    v = ['upper', 'lower'].map(f_);
    coords = v.map(function(d) {
      return d.geometry.coordinates;
    });
    f = createFeature("MultiPolygon", coords);
    f.properties = v[0].properties;
    return f;
  };
};

createErrorEllipse = function(opts) {
  var __fnAtLevel, levels;
  // Level can be single or array of error levels
  if (opts.level == null) {
    opts.level = 1;
  }
  levels = opts.level;
  __fnAtLevel = function(l) {
    var o1;
    o1 = cloneOptions(opts, {
      level: l
    });
    return __createErrorEllipse(o1);
  };
  if (Array.isArray(levels)) {
    // Return an array of functions, one for each
    // level of the ellipse to be generated
    return levels.map(__fnAtLevel);
  } else {
    // Return a single function for the specified
    // level
    return __fnAtLevel(levels);
  }
};




var functions = Object.freeze({
	get plane () { return createGroupedPlane; },
	get errorSurface () { return createErrorSurface; },
	get nominalPlane () { return createNominalPlane; },
	get errorEllipse () { return createErrorEllipse; }
});

var d;

d = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [[180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]
  }
};

var horizontal = function(stereonet) {
  var labelDistance;
  labelDistance = 4;
  return function() {
    var da, g, l, margin, sz, v;
    da = stereonet.overlay();
    g = da.append('g').attr('class', 'horizontal');
    g.append('path').datum(d);
    sz = stereonet.size();
    margin = stereonet.margin();
    l = g.append('g').attrs({
      class: 'labels',
      transform: `translate(${margin} ${sz / 2})`
    });
    l.append('text').text('E').attrs({
      class: 'axis-label',
      transform: `translate(${sz - 2 * margin} 0)`,
      'text-anchor': 'start',
      dx: labelDistance
    });
    l.append('text').text('W').attrs({
      class: 'axis-label',
      'text-anchor': 'end',
      dx: -labelDistance
    });
    // Vertical labels (may split out later)
    v = da.append('g').attrs({
      class: 'vertical',
      transform: `translate(${sz / 2} ${margin})`
    });
    v.append('line').attrs({
      y2: labelDistance
    });
    v.append('line').attrs({
      transform: `translate(0 ${sz - 2 * margin})`,
      y2: -labelDistance
    });
    return v.append('text').text('Vertical').attrs({
      class: 'axis-label',
      'alignment-baseline': 'baseline',
      'text-anchor': 'middle',
      dy: -labelDistance - 4
    });
  };
};

var d2r;

d2r = Math.PI / 180;

var vertical = function(stereonet) {
  return function(opts = {}) {
    var a, at, az, dip, dy, feat, g, grat, innerRadius, labels, locs, lon, m, proj, sel, v, x;
    if (opts.startOffset == null) {
      opts.startOffset = 10;
    }
    // correct for start at bottom
    opts.startOffset += 100;
    if (opts.labelPadding == null) {
      opts.labelPadding = 8;
    }
    g = stereonet.overlay();
    grat = stereonet.graticule();
    console.log(grat);
    labels = ["N", "E", "S", "W"];
    locs = [0, 90, 180, 270];
    az = g.append('g').attr('class', 'azimuthLabels');
    m = stereonet.margin();
    innerRadius = stereonet.size() / 2 - m;
    sel = az.selectAll('text').data(labels);
    sel.enter().append('text').text(function(d) {
      return d;
    }).attrs(function(d, i) {
      var angle, szm;
      szm = innerRadius + m;
      angle = (locs[i] - 90) * Math.PI / 180;
      return {
        transform: `translate(${szm} ${szm})`,
        x: Math.cos(angle) * (innerRadius + opts.labelPadding),
        y: Math.sin(angle) * (innerRadius + opts.labelPadding)
      };
    });
    dip = g.append('g').attr('class', 'dipLabels');
    lon = 220;
    feat = function(d) {
      return {
        type: 'Feature',
        label: `${d}°`,
        geometry: {
          type: 'Point',
          coordinates: [lon, -90 + d]
        }
      };
    };
    dy = 8;
    a = stereonet.clipAngle();
    v = (function() {
      var j, ref, results;
      results = [];
      for (x = j = 5, ref = a; j <= ref; x = j += 5) {
        results.push(x);
      }
      return results;
    })();
    proj = stereonet.projection();
    sel = dip.selectAll('text').data(v.map(feat));
    sel.enter().append('text').text(function(d) {
      return d.label;
    }).attr("transform", function(d) {
      v = proj(d.geometry.coordinates);
      return `translate(${v[0]}, ${v[1]}) rotate(${180 - lon})`;
    });
    at = {
      class: 'outer',
      dy: -dy
    };
    // Labels
    az.append('text').attrs(at).append('textPath').text('Azimuth →').attrs({
      'xlink:href': '#sphere',
      startOffset: `${innerRadius * opts.startOffset * d2r}`,
      method: 'stretch'
    });
    return dip.append('text').attrs(at).append('textPath').text('Dip').attrs({
      method: 'stretch',
      'xlink:href': '#sphere',
      startOffset: `${innerRadius * 70 * d2r}`
    });
  };
};

//# Stereonet Dragging
var interaction = function(stereonet) {
  var el, m0, mousedown, mousemove, mouseup, o0, proj;
  // modified from http://bl.ocks.org/1392560
  m0 = void 0;
  o0 = void 0;
  proj = stereonet.projection();
  el = stereonet.node();
  mousedown = function() {
    m0 = [d3$1.event.pageX, d3$1.event.pageY];
    o0 = stereonet.rotate();
    return d3$1.event.preventDefault();
  };
  mousemove = function() {
    var limit, m1, o1;
    if (m0) {
      m1 = [d3$1.event.pageX, d3$1.event.pageY];
      o1 = [o0[0] + (m1[0] - m0[0]) / 3, o0[1] + (m0[1] - m1[1]) / 3];
      limit = 90;
      o1[1] = o1[1] > limit ? limit : o1[1] < -limit ? -limit : o1[1];
      return stereonet.rotate(o1);
    }
  };
  mouseup = function() {
    if (m0) {
      mousemove();
      return m0 = null;
    }
  };
  el.on('mousedown', mousedown);
  return d3$1.select(window).on("mousemove", mousemove).on("mouseup", mouseup);
};

/*
Stereonet labeling:
Based heavily on http://bl.ocks.org/dwtkns/4686432

TODO: integrate text halos
http://bl.ocks.org/nitaku/aff4f425e7959290a1f7
*/
var __horizontalLine;
var horizontalLine;
var labels;

labels = [
  {
    name: 'N',
    c: [180,
  0]
  },
  {
    name: 'E',
    c: [90,
  0]
  },
  {
    name: 'S',
    c: [0,
  0]
  },
  {
    name: 'W',
    c: [-90,
  0]
  },
  {
    name: 'Up',
    c: [0,
  90]
  },
  {
    name: 'Down',
    c: [0,
  -90]
  }
];

__horizontalLine = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [[180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]
  }
};

horizontalLine = function(stereonet) {
  stereonet.overlay().append('g').attr("class", "horizontal").append('path').datum(__horizontalLine);
  return stereonet.refresh();
};

exports.globalLabels = function() {
  var i, l, len;
  for (i = 0, len = labels.length; i < len; i++) {
    l = labels[i];
    l.type = 'Feature';
    l.geometry = {
      type: 'Point',
      coordinates: l.c
    };
  }
  return function(stereonet) {
    var path, proj, svg, sz, updateLabels;
    sz = stereonet.size();
    proj = stereonet.projection();
    svg = stereonet.overlay();
    path = d3$1.geoPath().projection(proj).pointRadius(1);
    updateLabels = function() {
      var centerPos, width;
      console.log("Updating labels");
      proj = this.projection();
      centerPos = proj.invert([sz / 2, sz / 2]);
      width = stereonet.size();
      return svg.selectAll(".label").attr('alignment-baseline', 'middle').style('text-shadow', "-2px -2px white, -2px 2px white, 2px 2px white, 2px -2px white, -2px 0 white, 0 2px white, 2px 0 white, 0 -2px white").attr("text-anchor", function(d) {
        var x;
        x = proj(d.geometry.coordinates)[0];
        if (x < width / 2 - 20) {
          return 'end';
        }
        if (x < width / 2 + 20) {
          return 'middle';
        }
        return 'start';
      }).attr("transform", function(d) {
        var offset, offsetY, x, y;
        [x, y] = proj(d.geometry.coordinates);
        offset = x < width / 2 ? -5 : 5;
        offsetY = 0;
        if (y < width / 2 - 20) {
          offsetY = -5;
        }
        if (y > width / 2 + 20) {
          offsetY = 5;
        }
        return `translate(${x + offset},${y - 2 + offsetY})`;
      }).style("display", function(d) {
        d = d3$1.geoDistance(centerPos, d.geometry.coordinates);
        if (d > Math.PI / 2 + 0.01) {
          return 'none';
        } else {
          return 'inline';
        }
      });
    };
    stereonet.call(horizontalLine);
    svg.append("g").attr("class", "points").selectAll("path").data(labels).enter().append("path").attr("class", "point");
    svg.append("g").attr("class", "labels").selectAll("text").data(labels).enter().append("text").attr("class", "label").text(function(d) {
      return d.name;
    });
    updateLabels.apply(stereonet);
    return stereonet.on('rotate', updateLabels);
  };
};

var getterSetter;
var opts;

opts = {
  degrees: true,
  traditionalLayout: false,
  adaptive: false,
  n: 200, // Bug if we go over 60?
  level: 1 // 95% ci for 3 degrees of freedom
};

getterSetter = function(main) {
  return function(p, fn) {
    // A generic wrapper
    // to get/set variables
    if (fn == null) {
      fn = function(v) {
        return p = v;
      };
    }
    return function() {
      if (arguments.length > 0) {
        fn(...arguments);
        return main;
      } else {
        return p();
      }
    };
  };
};

exports.Stereonet = function() {
  var _, __getSet, __redraw, __setScale, callStack, clipAngle, data, dataArea, dispatch$$1, drawEllipses, drawPlanes, el, ell, ellipses, f, graticule, margin, overlay, path, planes, proj, s, scale, setGraticule, shouldClip;
  planes = null;
  ellipses = null;
  data = null;
  el = null;
  dataArea = null;
  overlay = null;
  margin = 20;
  scale = 300;
  clipAngle = 90;
  s = 0.00001;
  shouldClip = true;
  graticule = d3$1.geoGraticule().stepMinor([10, 10]).stepMajor([90, 10]).extentMinor([[-180, -80 - s], [180, 80 + s]]).extentMajor([[-180, -90 + s], [180, 90 - s]]);
  proj = d3$1.geoOrthographic().clipAngle(clipAngle).precision(0.01).rotate([0, 0]).scale(300);
  path = d3$1.geoPath().projection(proj).pointRadius(2);
  // Items to be added once DOM is available
  // (e.g. interaction)
  callStack = [];
  drawPlanes = function(data, o = {}) {
    var con, fn, sel;
    if (o.color == null) {
      o.color = '#aaaaaa';
    }
    if (el == null) {
      throw "Stereonet must be initialized to an element before adding data";
    }
    if (o.selector == null) {
      o.selector = 'g.planes';
    }
    con = dataArea.selectAppend(o.selector);
    fn = createGroupedPlane(opts);
    sel = con.selectAll('g.plane').data(data).enter().append('g').classed('plane', true).each(fn).each(function(d) {
      var color, e;
      if (typeof o.color === 'function') {
        color = o.color(d);
      } else {
        color = o.color;
      }
      e = d3$1.select(this);
      e.selectAll('path.error').attrs({
        fill: color
      });
      return e.selectAll('path.nominal').attrs({
        stroke: chroma(color).darken(.2).css()
      });
    });
    __redraw();
    return sel;
  };
  drawEllipses = function(data, o = {}) {
    var con, createEllipse, fn, sel;
    if (o.color == null) {
      o.color = '#aaaaaa';
    }
    if (el == null) {
      throw "Stereonet must be initialized to an element before adding data";
    }
    fn = createErrorEllipse(opts);
    createEllipse = function(d) {
      return d3$1.select(this).append('path').attr('class', 'error').datum(fn(d));
    };
    con = dataArea.append('g').attr('class', 'normal-vectors');
    sel = con.selectAll('g.normal').data(data).enter().append('g').classed('normal', true).each(createEllipse);
    sel.each(function(d) {
      var color, e;
      if (typeof o.color === 'function') {
        color = o.color(d);
      } else {
        color = o.color;
      }
      return e = d3$1.select(this).selectAll('path.error').attrs({
        fill: color
      });
    });
    __redraw();
    return sel;
  };
  __setScale = function(n) {
    var _pscale, radius;
    if (n != null) {
      // Scale the stereonet to an appropriate size
      scale = n;
    }
    radius = scale / 2 - margin;
    if (clipAngle < 89) {
      _pscale = radius / Math.sin(Math.PI / 180 * clipAngle);
      if (shouldClip) {
        proj.clipAngle(clipAngle);
      }
      proj.scale(_pscale).translate([scale / 2, scale / 2]);
    } else {
      proj.scale(radius).translate([scale / 2, scale / 2]);
    }
    path = d3$1.geoPath().projection(proj);
    if (el != null) {
      return el.attrs({
        height: scale,
        width: scale
      });
    }
  };
  __redraw = () => {
    if (el == null) {
      return;
    }
    return el.selectAll('path').attr('d', path.pointRadius(2));
  };
  dispatch$$1 = d3$1.dispatch('rotate', 'redraw');
  f = function(_el, opts = {}) {
    var int, item, j, len;
    // This should be integrated into a reusable
    // component
    el = _el;
    __setScale(); // Scale the stereonet
    el.append("defs").append("path").datum({
      type: "Sphere"
    }).attrs({
      d: path,
      id: "sphere"
    });
    el.append("clipPath").attr("id", "neatline-clip").append("use").attr("xlink:href", "#sphere");
    el.append("use").attrs({
      class: 'background',
      fill: 'white',
      stroke: '#aaaaaa'
    });
    int = el.append('g').attrs({
      class: 'interior'
    });
    int.append('path').datum(graticule).attrs({
      class: 'graticule',
      d: path
    });
    dataArea = int.append('g').attrs({
      class: 'data'
    });
    if (shouldClip) {
      el.append("use").attrs({
        class: 'neatline',
        "xlink:href": "#sphere"
      });
      int.attr('clip-path', "url(#neatline-clip)");
    }
    overlay = el.append("g").attrs({
      class: "overlay"
    });
    for (j = 0, len = callStack.length; j < len; j++) {
      item = callStack[j];
      item();
    }
    // Finally, draw all the paths at once
    return __redraw();
  };
  __getSet = getterSetter(f);
  // Getter-setter for data
  f.data = __getSet(function() {
    return data;
  }, (o) => {
    return data = o;
  });
  f.node = function() {
    return el;
  };
  f.margin = __getSet(function() {
    return margin;
  }, (o) => {
    return margin = o;
  });
  f.size = __getSet(function() {
    return scale;
  }, __setScale);
  f.innerSize = function() {
    return scale - margin;
  };
  f.projection = function() {
    return proj;
  };
  f.clip = __getSet(function() {
    return shouldClip;
  }, function(c) {
    return shouldClip = c;
  });
  f.refresh = function() {
    return __redraw();
  };
  f.rotate = (coords) => {
    if (coords == null) {
      return proj.rotate();
    }
    proj.rotate(coords);
    dispatch$$1.call('rotate', f);
    return __redraw();
  };
  f.centerPosition = function() {
    var centerPos;
    return centerPos = proj.invert([scale / 2, scale / 2]);
  };
  f.d3 = d3$1;
  f.on = function(event$$1, callback) {
    return dispatch$$1.on(event$$1, callback);
  };
  setGraticule = function(lon, lat) {
    //# Could also make this take a d3.geoGraticule object ##
    s = 0.00001;
    return graticule = d3$1.geoGraticule().stepMinor([lon, lat]).stepMajor([90, lat]).extentMinor([[-180, -90 + lat - s], [180, 90 - lat + s]]).extentMajor([[-180, -90 + s], [180, 90 - s]]);
  };
  f.graticule = __getSet(function() {
    return graticule;
  }, setGraticule);
  _ = function(c) {
    if (c === 'vertical') {
      c = [0, 90];
    }
    proj.rotate(c);
    if (el != null) {
      return __redraw();
    }
  };
  f.center = __getSet(function() {
    return proj.rotate;
  }, _);
  _ = function(c) {
    clipAngle = c;
    proj.rotate([0, -90]);
    __setScale();
    return f;
  };
  f.clipAngle = __getSet(function() {
    return clipAngle;
  }, _);
  f.planes = drawPlanes;
  f.draw = __redraw;
  f.path = function() {
    return path;
  };
  f.call = function(fn, ...args) {
    var todo;
    todo = function() {
      return fn(f, ...args);
    };
    if (f.node() != null) {
      todo();
    } else {
      callStack.push(todo);
    }
    return f;
  };
  ell = function() {
    var attrs, data_, fn, o, sel;
    // Same call signature as d3.Selection.data
    attrs = null;
    data_ = null;
    sel = null;
    fn = null;
    o = function(el_) {
      ell = createErrorEllipse(opts);
      sel = function() {
        return el_.selectAll('path.ellipse').data(data_.map(ell), fn);
      };
      sel().enter().append('path').attr('class', "ellipse").attrs(attrs).exit().remove();
      if (el != null) {
        __redraw();
      }
      return sel;
    };
    __getSet = getterSetter(o);
    o.data = __getSet(data_, function(d, f) {
      data_ = d;
      return fn = f;
    });
    o.attrs = __getSet(attrs, function(o) {
      attrs = o;
      if (sel != null) {
        return sel().attrs(attrs);
      }
    });
    o.selection = sel;
    return o;
  };
  f.ellipses = drawEllipses;
  f.dataArea = function() {
    return dataArea;
  };
  f.overlay = function() {
    return overlay;
  };
  f.horizontal = horizontal(f);
  f.vertical = vertical(f);
  f.call(interaction);
  return f;
};

exports.opacityByCertainty = function(colorFunc, accessor = null) {
  var __getSet, alphaScale, angularError, darkenStroke, f, maxOpacity;
  angularError = function(d) {
    return d.max_angular_error;
  };
  darkenStroke = 0.2;
  maxOpacity = 5;
  alphaScale = d3$1.scalePow(4).range([0.8, 0.1]).domain([0, maxOpacity]);
  alphaScale.clamp(true);
  f = function(d, i) {
    var al, angError, color, e, fill, stroke;
    angError = angularError(d);
    al = alphaScale(angError);
    color = chroma(colorFunc(d));
    fill = color.alpha(al).css();
    stroke = color.alpha(al + darkenStroke).css();
    e = d3$1.select(this);
    if (accessor != null) {
      e = e.selectAll('path.error');
    }
    return e.attrs({fill, stroke});
  };
  __getSet = getterSetter(f);
  f.angularError = __getSet(angularError, function(v) {
    return angularError = v;
  });
  f.max = __getSet(maxOpacity, function(v) {
    return maxOpacity = v;
  });
  return f;
};

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

/**
 * Test whether a value is a BigNumber
 * @param {*} x
 * @return {boolean}
 */
var isBigNumber = function isBigNumber(x) {
  return x && x.constructor.prototype.isBigNumber || false
};

var object = createCommonjsModule(function (module, exports) {
'use strict';



/**
 * Clone an object
 *
 *     clone(x)
 *
 * Can clone any primitive type, array, and object.
 * If x has a function clone, this function will be invoked to clone the object.
 *
 * @param {*} x
 * @return {*} clone
 */
exports.clone = function clone(x) {
  var type = typeof x;

  // immutable primitive types
  if (type === 'number' || type === 'string' || type === 'boolean' ||
      x === null || x === undefined) {
    return x;
  }

  // use clone function of the object when available
  if (typeof x.clone === 'function') {
    return x.clone();
  }

  // array
  if (Array.isArray(x)) {
    return x.map(function (value) {
      return clone(value);
    });
  }

  if (x instanceof Number)    return new Number(x.valueOf());
  if (x instanceof String)    return new String(x.valueOf());
  if (x instanceof Boolean)   return new Boolean(x.valueOf());
  if (x instanceof Date)      return new Date(x.valueOf());
  if (isBigNumber(x))         return x; // bignumbers are immutable
  if (x instanceof RegExp)  throw new TypeError('Cannot clone ' + x);  // TODO: clone a RegExp

  // object
  return exports.map(x, clone);
};

/**
 * Apply map to all properties of an object
 * @param {Object} object
 * @param {function} callback
 * @return {Object} Returns a copy of the object with mapped properties
 */
exports.map = function(object, callback) {
  var clone = {};

  for (var key in object) {
    if (exports.hasOwnProperty(object, key)) {
      clone[key] = callback(object[key]);
    }
  }

  return clone;
};

/**
 * Extend object a with the properties of object b
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 */
exports.extend = function(a, b) {
  for (var prop in b) {
    if (exports.hasOwnProperty(b, prop)) {
      a[prop] = b[prop];
    }
  }
  return a;
};

/**
 * Deep extend an object a with the properties of object b
 * @param {Object} a
 * @param {Object} b
 * @returns {Object}
 */
exports.deepExtend = function deepExtend (a, b) {
  // TODO: add support for Arrays to deepExtend
  if (Array.isArray(b)) {
    throw new TypeError('Arrays are not supported by deepExtend');
  }

  for (var prop in b) {
    if (exports.hasOwnProperty(b, prop)) {
      if (b[prop] && b[prop].constructor === Object) {
        if (a[prop] === undefined) {
          a[prop] = {};
        }
        if (a[prop].constructor === Object) {
          deepExtend(a[prop], b[prop]);
        }
        else {
          a[prop] = b[prop];
        }
      } else if (Array.isArray(b[prop])) {
        throw new TypeError('Arrays are not supported by deepExtend');
      } else {
        a[prop] = b[prop];
      }
    }
  }
  return a;
};

/**
 * Deep test equality of all fields in two pairs of arrays or objects.
 * @param {Array | Object} a
 * @param {Array | Object} b
 * @returns {boolean}
 */
exports.deepEqual = function deepEqual (a, b) {
  var prop, i, len;
  if (Array.isArray(a)) {
    if (!Array.isArray(b)) {
      return false;
    }

    if (a.length != b.length) {
      return false;
    }

    for (i = 0, len = a.length; i < len; i++) {
      if (!exports.deepEqual(a[i], b[i])) {
        return false;
      }
    }
    return true;
  }
  else if (a instanceof Object) {
    if (Array.isArray(b) || !(b instanceof Object)) {
      return false;
    }

    for (prop in a) {
      //noinspection JSUnfilteredForInLoop
      if (!exports.deepEqual(a[prop], b[prop])) {
        return false;
      }
    }
    for (prop in b) {
      //noinspection JSUnfilteredForInLoop
      if (!exports.deepEqual(a[prop], b[prop])) {
        return false;
      }
    }
    return true;
  }
  else {
    return (typeof a === typeof b) && (a == b);
  }
};

/**
 * Test whether the current JavaScript engine supports Object.defineProperty
 * @returns {boolean} returns true if supported
 */
exports.canDefineProperty = function () {
  // test needed for broken IE8 implementation
  try {
    if (Object.defineProperty) {
      Object.defineProperty({}, 'x', { get: function () {} });
      return true;
    }
  } catch (e) {}

  return false;
};

/**
 * Attach a lazy loading property to a constant.
 * The given function `fn` is called once when the property is first requested.
 * On older browsers (<IE8), the function will fall back to direct evaluation
 * of the properties value.
 * @param {Object} object   Object where to add the property
 * @param {string} prop     Property name
 * @param {Function} fn     Function returning the property value. Called
 *                          without arguments.
 */
exports.lazy = function (object, prop, fn) {
  if (exports.canDefineProperty()) {
    var _uninitialized = true;
    var _value;
    Object.defineProperty(object, prop, {
      get: function () {
        if (_uninitialized) {
          _value = fn();
          _uninitialized = false;
        }
        return _value;
      },

      set: function (value) {
        _value = value;
        _uninitialized = false;
      },

      configurable: true,
      enumerable: true
    });
  }
  else {
    // fall back to immediate evaluation
    object[prop] = fn();
  }
};

/**
 * Traverse a path into an object.
 * When a namespace is missing, it will be created
 * @param {Object} object
 * @param {string} path   A dot separated string like 'name.space'
 * @return {Object} Returns the object at the end of the path
 */
exports.traverse = function(object, path) {
  var obj = object;

  if (path) {
    var names = path.split('.');
    for (var i = 0; i < names.length; i++) {
      var name = names[i];
      if (!(name in obj)) {
        obj[name] = {};
      }
      obj = obj[name];
    }
  }

  return obj;
};

/**
 * A safe hasOwnProperty
 * @param {Object} object
 * @param {string} property
 */
exports.hasOwnProperty = function (object, property) {
  return object && Object.hasOwnProperty.call(object, property);
};

/**
 * Test whether an object is a factory. a factory has fields:
 *
 * - factory: function (type: Object, config: Object, load: function, typed: function [, math: Object])   (required)
 * - name: string (optional)
 * - path: string    A dot separated path (optional)
 * - math: boolean   If true (false by default), the math namespace is passed
 *                   as fifth argument of the factory function
 *
 * @param {*} object
 * @returns {boolean}
 */
exports.isFactory = function (object) {
  return object && typeof object.factory === 'function';
};
});

var typedFunction = createCommonjsModule(function (module, exports) {
/**
 * typed-function
 *
 * Type checking for JavaScript functions
 *
 * https://github.com/josdejong/typed-function
 */
'use strict';

(function (root, factory) {
  if (typeof undefined === 'function' && undefined.amd) {
    // AMD. Register as an anonymous module.
    undefined([], factory);
  } else {
    // OldNode. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like OldNode.
    module.exports = factory();
  }
}(commonjsGlobal, function () {
  // factory function to create a new instance of typed-function
  // TODO: allow passing configuration, types, tests via the factory function
  function create() {
    /**
     * Get a type test function for a specific data type
     * @param {string} name                   Name of a data type like 'number' or 'string'
     * @returns {Function(obj: *) : boolean}  Returns a type testing function.
     *                                        Throws an error for an unknown type.
     */
    function getTypeTest(name) {
      var test;
      for (var i = 0; i < typed.types.length; i++) {
        var entry = typed.types[i];
        if (entry.name === name) {
          test = entry.test;
          break;
        }
      }

      if (!test) {
        var hint;
        for (i = 0; i < typed.types.length; i++) {
          entry = typed.types[i];
          if (entry.name.toLowerCase() == name.toLowerCase()) {
            hint = entry.name;
            break;
          }
        }

        throw new Error('Unknown type "' + name + '"' +
            (hint ? ('. Did you mean "' + hint + '"?') : ''));
      }
      return test;
    }

    /**
     * Retrieve the function name from a set of functions, and check
     * whether the name of all functions match (if given)
     * @param {Array.<function>} fns
     */
    function getName (fns) {
      var name = '';

      for (var i = 0; i < fns.length; i++) {
        var fn = fns[i];

        // merge function name when this is a typed function
        if (fn.signatures && fn.name != '') {
          if (name == '') {
            name = fn.name;
          }
          else if (name != fn.name) {
            var err = new Error('Function names do not match (expected: ' + name + ', actual: ' + fn.name + ')');
            err.data = {
              actual: fn.name,
              expected: name
            };
            throw err;
          }
        }
      }

      return name;
    }

    /**
     * Create an ArgumentsError. Creates messages like:
     *
     *   Unexpected type of argument (expected: ..., actual: ..., index: ...)
     *   Too few arguments (expected: ..., index: ...)
     *   Too many arguments (expected: ..., actual: ...)
     *
     * @param {String} fn         Function name
     * @param {number} argCount   Number of arguments
     * @param {Number} index      Current argument index
     * @param {*} actual          Current argument
     * @param {string} [expected] An optional, comma separated string with
     *                            expected types on given index
     * @extends Error
     */
    function createError(fn, argCount, index, actual, expected) {
      var actualType = getTypeOf(actual);
      var _expected = expected ? expected.split(',') : null;
      var _fn = (fn || 'unnamed');
      var anyType = _expected && contains(_expected, 'any');
      var message;
      var data = {
        fn: fn,
        index: index,
        actual: actual,
        expected: _expected
      };

      if (_expected) {
        if (argCount > index && !anyType) {
          // unexpected type
          message = 'Unexpected type of argument in function ' + _fn +
              ' (expected: ' + _expected.join(' or ') + ', actual: ' + actualType + ', index: ' + index + ')';
        }
        else {
          // too few arguments
          message = 'Too few arguments in function ' + _fn +
              ' (expected: ' + _expected.join(' or ') + ', index: ' + index + ')';
        }
      }
      else {
        // too many arguments
        message = 'Too many arguments in function ' + _fn +
            ' (expected: ' + index + ', actual: ' + argCount + ')';
      }

      var err = new TypeError(message);
      err.data = data;
      return err;
    }

    /**
     * Collection with function references (local shortcuts to functions)
     * @constructor
     * @param {string} [name='refs']  Optional name for the refs, used to generate
     *                                JavaScript code
     */
    function Refs(name) {
      this.name = name || 'refs';
      this.categories = {};
    }

    /**
     * Add a function reference.
     * @param {Function} fn
     * @param {string} [category='fn']    A function category, like 'fn' or 'signature'
     * @returns {string} Returns the function name, for example 'fn0' or 'signature2'
     */
    Refs.prototype.add = function (fn, category) {
      var cat = category || 'fn';
      if (!this.categories[cat]) this.categories[cat] = [];

      var index = this.categories[cat].indexOf(fn);
      if (index == -1) {
        index = this.categories[cat].length;
        this.categories[cat].push(fn);
      }

      return cat + index;
    };

    /**
     * Create code lines for all function references
     * @returns {string} Returns the code containing all function references
     */
    Refs.prototype.toCode = function () {
      var code = [];
      var path = this.name + '.categories';
      var categories = this.categories;

      for (var cat in categories) {
        if (categories.hasOwnProperty(cat)) {
          var category = categories[cat];

          for (var i = 0; i < category.length; i++) {
            code.push('var ' + cat + i + ' = ' + path + '[\'' + cat + '\'][' + i + '];');
          }
        }
      }

      return code.join('\n');
    };

    /**
     * A function parameter
     * @param {string | string[] | Param} types    A parameter type like 'string',
     *                                             'number | boolean'
     * @param {boolean} [varArgs=false]            Variable arguments if true
     * @constructor
     */
    function Param(types, varArgs) {
      // parse the types, can be a string with types separated by pipe characters |
      if (typeof types === 'string') {
        // parse variable arguments operator (ellipses '...number')
        var _types = types.trim();
        var _varArgs = _types.substr(0, 3) === '...';
        if (_varArgs) {
          _types = _types.substr(3);
        }
        if (_types === '') {
          this.types = ['any'];
        }
        else {
          this.types = _types.split('|');
          for (var i = 0; i < this.types.length; i++) {
            this.types[i] = this.types[i].trim();
          }
        }
      }
      else if (Array.isArray(types)) {
        this.types = types;
      }
      else if (types instanceof Param) {
        return types.clone();
      }
      else {
        throw new Error('String or Array expected');
      }

      // can hold a type to which to convert when handling this parameter
      this.conversions = [];
      // TODO: implement better API for conversions, be able to add conversions via constructor (support a new type Object?)

      // variable arguments
      this.varArgs = _varArgs || varArgs || false;

      // check for any type arguments
      this.anyType = this.types.indexOf('any') !== -1;
    }

    /**
     * Order Params
     * any type ('any') will be ordered last, and object as second last (as other
     * types may be an object as well, like Array).
     *
     * @param {Param} a
     * @param {Param} b
     * @returns {number} Returns 1 if a > b, -1 if a < b, and else 0.
     */
    Param.compare = function (a, b) {
      // TODO: simplify parameter comparison, it's a mess
      if (a.anyType) return 1;
      if (b.anyType) return -1;

      if (contains(a.types, 'Object')) return 1;
      if (contains(b.types, 'Object')) return -1;

      if (a.hasConversions()) {
        if (b.hasConversions()) {
          var i, ac, bc;

          for (i = 0; i < a.conversions.length; i++) {
            if (a.conversions[i] !== undefined) {
              ac = a.conversions[i];
              break;
            }
          }

          for (i = 0; i < b.conversions.length; i++) {
            if (b.conversions[i] !== undefined) {
              bc = b.conversions[i];
              break;
            }
          }

          return typed.conversions.indexOf(ac) - typed.conversions.indexOf(bc);
        }
        else {
          return 1;
        }
      }
      else {
        if (b.hasConversions()) {
          return -1;
        }
        else {
          // both params have no conversions
          var ai, bi;

          for (i = 0; i < typed.types.length; i++) {
            if (typed.types[i].name === a.types[0]) {
              ai = i;
              break;
            }
          }

          for (i = 0; i < typed.types.length; i++) {
            if (typed.types[i].name === b.types[0]) {
              bi = i;
              break;
            }
          }

          return ai - bi;
        }
      }
    };

    /**
     * Test whether this parameters types overlap an other parameters types.
     * Will not match ['any'] with ['number']
     * @param {Param} other
     * @return {boolean} Returns true when there are overlapping types
     */
    Param.prototype.overlapping = function (other) {
      for (var i = 0; i < this.types.length; i++) {
        if (contains(other.types, this.types[i])) {
          return true;
        }
      }
      return false;
    };

    /**
     * Test whether this parameters types matches an other parameters types.
     * When any of the two parameters contains `any`, true is returned
     * @param {Param} other
     * @return {boolean} Returns true when there are matching types
     */
    Param.prototype.matches = function (other) {
      return this.anyType || other.anyType || this.overlapping(other);
    };

    /**
     * Create a clone of this param
     * @returns {Param} Returns a cloned version of this param
     */
    Param.prototype.clone = function () {
      var param = new Param(this.types.slice(), this.varArgs);
      param.conversions = this.conversions.slice();
      return param;
    };

    /**
     * Test whether this parameter contains conversions
     * @returns {boolean} Returns true if the parameter contains one or
     *                    multiple conversions.
     */
    Param.prototype.hasConversions = function () {
      return this.conversions.length > 0;
    };

    /**
     * Tests whether this parameters contains any of the provided types
     * @param {Object} types  A Map with types, like {'number': true}
     * @returns {boolean}     Returns true when the parameter contains any
     *                        of the provided types
     */
    Param.prototype.contains = function (types) {
      for (var i = 0; i < this.types.length; i++) {
        if (types[this.types[i]]) {
          return true;
        }
      }
      return false;
    };

    /**
     * Return a string representation of this params types, like 'string' or
     * 'number | boolean' or '...number'
     * @param {boolean} [toConversion]   If true, the returned types string
     *                                   contains the types where the parameter
     *                                   will convert to. If false (default)
     *                                   the "from" types are returned
     * @returns {string}
     */
    Param.prototype.toString = function (toConversion) {
      var types = [];
      var keys = {};

      for (var i = 0; i < this.types.length; i++) {
        var conversion = this.conversions[i];
        var type = toConversion && conversion ? conversion.to : this.types[i];
        if (!(type in keys)) {
          keys[type] = true;
          types.push(type);
        }
      }

      return (this.varArgs ? '...' : '') + types.join('|');
    };

    /**
     * A function signature
     * @param {string | string[] | Param[]} params
     *                         Array with the type(s) of each parameter,
     *                         or a comma separated string with types
     * @param {Function} fn    The actual function
     * @constructor
     */
    function Signature(params, fn) {
      var _params;
      if (typeof params === 'string') {
        _params = (params !== '') ? params.split(',') : [];
      }
      else if (Array.isArray(params)) {
        _params = params;
      }
      else {
        throw new Error('string or Array expected');
      }

      this.params = new Array(_params.length);
      this.anyType = false;
      this.varArgs = false;
      for (var i = 0; i < _params.length; i++) {
        var param = new Param(_params[i]);
        this.params[i] = param;
        if (param.anyType) {
          this.anyType = true;
        }
        if (i === _params.length - 1) {
          // the last argument
          this.varArgs = param.varArgs;
        }
        else {
          // non-last argument
          if (param.varArgs) {
            throw new SyntaxError('Unexpected variable arguments operator "..."');
          }
        }
      }

      this.fn = fn;
    }

    /**
     * Create a clone of this signature
     * @returns {Signature} Returns a cloned version of this signature
     */
    Signature.prototype.clone = function () {
      return new Signature(this.params.slice(), this.fn);
    };

    /**
     * Expand a signature: split params with union types in separate signatures
     * For example split a Signature "string | number" into two signatures.
     * @return {Signature[]} Returns an array with signatures (at least one)
     */
    Signature.prototype.expand = function () {
      var signatures = [];

      function recurse(signature, path) {
        if (path.length < signature.params.length) {
          var i, newParam, conversion;

          var param = signature.params[path.length];
          if (param.varArgs) {
            // a variable argument. do not split the types in the parameter
            newParam = param.clone();

            // add conversions to the parameter
            // recurse for all conversions
            for (i = 0; i < typed.conversions.length; i++) {
              conversion = typed.conversions[i];
              if (!contains(param.types, conversion.from) && contains(param.types, conversion.to)) {
                var j = newParam.types.length;
                newParam.types[j] = conversion.from;
                newParam.conversions[j] = conversion;
              }
            }

            recurse(signature, path.concat(newParam));
          }
          else {
            // split each type in the parameter
            for (i = 0; i < param.types.length; i++) {
              recurse(signature, path.concat(new Param(param.types[i])));
            }

            // recurse for all conversions
            for (i = 0; i < typed.conversions.length; i++) {
              conversion = typed.conversions[i];
              if (!contains(param.types, conversion.from) && contains(param.types, conversion.to)) {
                newParam = new Param(conversion.from);
                newParam.conversions[0] = conversion;
                recurse(signature, path.concat(newParam));
              }
            }
          }
        }
        else {
          signatures.push(new Signature(path, signature.fn));
        }
      }

      recurse(this, []);

      return signatures;
    };

    /**
     * Compare two signatures.
     *
     * When two params are equal and contain conversions, they will be sorted
     * by lowest index of the first conversions.
     *
     * @param {Signature} a
     * @param {Signature} b
     * @returns {number} Returns 1 if a > b, -1 if a < b, and else 0.
     */
    Signature.compare = function (a, b) {
      if (a.params.length > b.params.length) return 1;
      if (a.params.length < b.params.length) return -1;

      // count the number of conversions
      var i;
      var len = a.params.length; // a and b have equal amount of params
      var ac = 0;
      var bc = 0;
      for (i = 0; i < len; i++) {
        if (a.params[i].hasConversions()) ac++;
        if (b.params[i].hasConversions()) bc++;
      }

      if (ac > bc) return 1;
      if (ac < bc) return -1;

      // compare the order per parameter
      for (i = 0; i < a.params.length; i++) {
        var cmp = Param.compare(a.params[i], b.params[i]);
        if (cmp !== 0) {
          return cmp;
        }
      }

      return 0;
    };

    /**
     * Test whether any of the signatures parameters has conversions
     * @return {boolean} Returns true when any of the parameters contains
     *                   conversions.
     */
    Signature.prototype.hasConversions = function () {
      for (var i = 0; i < this.params.length; i++) {
        if (this.params[i].hasConversions()) {
          return true;
        }
      }
      return false;
    };

    /**
     * Test whether this signature should be ignored.
     * Checks whether any of the parameters contains a type listed in
     * typed.ignore
     * @return {boolean} Returns true when the signature should be ignored
     */
    Signature.prototype.ignore = function () {
      // create a map with ignored types
      var types = {};
      for (var i = 0; i < typed.ignore.length; i++) {
        types[typed.ignore[i]] = true;
      }

      // test whether any of the parameters contains this type
      for (i = 0; i < this.params.length; i++) {
        if (this.params[i].contains(types)) {
          return true;
        }
      }

      return false;
    };

    /**
     * Test whether the path of this signature matches a given path.
     * @param {Param[]} params
     */
    Signature.prototype.paramsStartWith = function (params) {
      if (params.length === 0) {
        return true;
      }

      var aLast = last(this.params);
      var bLast = last(params);

      for (var i = 0; i < params.length; i++) {
        var a = this.params[i] || (aLast.varArgs ? aLast: null);
        var b = params[i]      || (bLast.varArgs ? bLast: null);

        if (!a ||  !b || !a.matches(b)) {
          return false;
        }
      }

      return true;
    };

    /**
     * Generate the code to invoke this signature
     * @param {Refs} refs
     * @param {string} prefix
     * @returns {string} Returns code
     */
    Signature.prototype.toCode = function (refs, prefix) {
      var code = [];

      var args = new Array(this.params.length);
      for (var i = 0; i < this.params.length; i++) {
        var param = this.params[i];
        var conversion = param.conversions[0];
        if (param.varArgs) {
          args[i] = 'varArgs';
        }
        else if (conversion) {
          args[i] = refs.add(conversion.convert, 'convert') + '(arg' + i + ')';
        }
        else {
          args[i] = 'arg' + i;
        }
      }

      var ref = this.fn ? refs.add(this.fn, 'signature') : undefined;
      if (ref) {
        return prefix + 'return ' + ref + '(' + args.join(', ') + '); // signature: ' + this.params.join(', ');
      }

      return code.join('\n');
    };

    /**
     * Return a string representation of the signature
     * @returns {string}
     */
    Signature.prototype.toString = function () {
      return this.params.join(', ');
    };

    /**
     * A group of signatures with the same parameter on given index
     * @param {Param[]} path
     * @param {Signature} [signature]
     * @param {Node[]} childs
     * @param {boolean} [fallThrough=false]
     * @constructor
     */
    function Node(path, signature, childs, fallThrough) {
      this.path = path || [];
      this.param = path[path.length - 1] || null;
      this.signature = signature || null;
      this.childs = childs || [];
      this.fallThrough = fallThrough || false;
    }

    /**
     * Generate code for this group of signatures
     * @param {Refs} refs
     * @param {string} prefix
     * @returns {string} Returns the code as string
     */
    Node.prototype.toCode = function (refs, prefix) {
      // TODO: split this function in multiple functions, it's too large
      var code = [];

      if (this.param) {
        var index = this.path.length - 1;
        var conversion = this.param.conversions[0];
        var comment = '// type: ' + (conversion ?
                (conversion.from + ' (convert to ' + conversion.to + ')') :
                this.param);

        // non-root node (path is non-empty)
        if (this.param.varArgs) {
          if (this.param.anyType) {
            // variable arguments with any type
            code.push(prefix + 'if (arguments.length > ' + index + ') {');
            code.push(prefix + '  var varArgs = [];');
            code.push(prefix + '  for (var i = ' + index + '; i < arguments.length; i++) {');
            code.push(prefix + '    varArgs.push(arguments[i]);');
            code.push(prefix + '  }');
            code.push(this.signature.toCode(refs, prefix + '  '));
            code.push(prefix + '}');
          }
          else {
            // variable arguments with a fixed type
            var getTests = function (types, arg) {
              var tests = [];
              for (var i = 0; i < types.length; i++) {
                tests[i] = refs.add(getTypeTest(types[i]), 'test') + '(' + arg + ')';
              }
              return tests.join(' || ');
            }.bind(this);

            var allTypes = this.param.types;
            var exactTypes = [];
            for (var i = 0; i < allTypes.length; i++) {
              if (this.param.conversions[i] === undefined) {
                exactTypes.push(allTypes[i]);
              }
            }

            code.push(prefix + 'if (' + getTests(allTypes, 'arg' + index) + ') { ' + comment);
            code.push(prefix + '  var varArgs = [arg' + index + '];');
            code.push(prefix + '  for (var i = ' + (index + 1) + '; i < arguments.length; i++) {');
            code.push(prefix + '    if (' + getTests(exactTypes, 'arguments[i]') + ') {');
            code.push(prefix + '      varArgs.push(arguments[i]);');

            for (var i = 0; i < allTypes.length; i++) {
              var conversion_i = this.param.conversions[i];
              if (conversion_i) {
                var test = refs.add(getTypeTest(allTypes[i]), 'test');
                var convert = refs.add(conversion_i.convert, 'convert');
                code.push(prefix + '    }');
                code.push(prefix + '    else if (' + test + '(arguments[i])) {');
                code.push(prefix + '      varArgs.push(' + convert + '(arguments[i]));');
              }
            }
            code.push(prefix + '    } else {');
            code.push(prefix + '      throw createError(name, arguments.length, i, arguments[i], \'' + exactTypes.join(',') + '\');');
            code.push(prefix + '    }');
            code.push(prefix + '  }');
            code.push(this.signature.toCode(refs, prefix + '  '));
            code.push(prefix + '}');
          }
        }
        else {
          if (this.param.anyType) {
            // any type
            code.push(prefix + '// type: any');
            code.push(this._innerCode(refs, prefix));
          }
          else {
            // regular type
            var type = this.param.types[0];
            var test = type !== 'any' ? refs.add(getTypeTest(type), 'test') : null;

            code.push(prefix + 'if (' + test + '(arg' + index + ')) { ' + comment);
            code.push(this._innerCode(refs, prefix + '  '));
            code.push(prefix + '}');
          }
        }
      }
      else {
        // root node (path is empty)
        code.push(this._innerCode(refs, prefix));
      }

      return code.join('\n');
    };

    /**
     * Generate inner code for this group of signatures.
     * This is a helper function of Node.prototype.toCode
     * @param {Refs} refs
     * @param {string} prefix
     * @returns {string} Returns the inner code as string
     * @private
     */
    Node.prototype._innerCode = function (refs, prefix) {
      var code = [];
      var i;

      if (this.signature) {
        code.push(prefix + 'if (arguments.length === ' + this.path.length + ') {');
        code.push(this.signature.toCode(refs, prefix + '  '));
        code.push(prefix + '}');
      }

      for (i = 0; i < this.childs.length; i++) {
        code.push(this.childs[i].toCode(refs, prefix));
      }

      // TODO: shouldn't the this.param.anyType check be redundant
      if (!this.fallThrough || (this.param && this.param.anyType)) {
        var exceptions = this._exceptions(refs, prefix);
        if (exceptions) {
          code.push(exceptions);
        }
      }

      return code.join('\n');
    };


    /**
     * Generate code to throw exceptions
     * @param {Refs} refs
     * @param {string} prefix
     * @returns {string} Returns the inner code as string
     * @private
     */
    Node.prototype._exceptions = function (refs, prefix) {
      var index = this.path.length;

      if (this.childs.length === 0) {
        // TODO: can this condition be simplified? (we have a fall-through here)
        return [
          prefix + 'if (arguments.length > ' + index + ') {',
          prefix + '  throw createError(name, arguments.length, ' + index + ', arguments[' + index + ']);',
          prefix + '}'
        ].join('\n');
      }
      else {
        var keys = {};
        var types = [];

        for (var i = 0; i < this.childs.length; i++) {
          var node = this.childs[i];
          if (node.param) {
            for (var j = 0; j < node.param.types.length; j++) {
              var type = node.param.types[j];
              if (!(type in keys) && !node.param.conversions[j]) {
                keys[type] = true;
                types.push(type);
              }
            }
          }
        }

        return prefix + 'throw createError(name, arguments.length, ' + index + ', arguments[' + index + '], \'' + types.join(',') + '\');';
      }
    };

    /**
     * Split all raw signatures into an array with expanded Signatures
     * @param {Object.<string, Function>} rawSignatures
     * @return {Signature[]} Returns an array with expanded signatures
     */
    function parseSignatures(rawSignatures) {
      // FIXME: need to have deterministic ordering of signatures, do not create via object
      var signature;
      var keys = {};
      var signatures = [];
      var i;

      for (var types in rawSignatures) {
        if (rawSignatures.hasOwnProperty(types)) {
          var fn = rawSignatures[types];
          signature = new Signature(types, fn);

          if (signature.ignore()) {
            continue;
          }

          var expanded = signature.expand();

          for (i = 0; i < expanded.length; i++) {
            var signature_i = expanded[i];
            var key = signature_i.toString();
            var existing = keys[key];
            if (!existing) {
              keys[key] = signature_i;
            }
            else {
              var cmp = Signature.compare(signature_i, existing);
              if (cmp < 0) {
                // override if sorted first
                keys[key] = signature_i;
              }
              else if (cmp === 0) {
                throw new Error('Signature "' + key + '" is defined twice');
              }
              // else: just ignore
            }
          }
        }
      }

      // convert from map to array
      for (key in keys) {
        if (keys.hasOwnProperty(key)) {
          signatures.push(keys[key]);
        }
      }

      // order the signatures
      signatures.sort(function (a, b) {
        return Signature.compare(a, b);
      });

      // filter redundant conversions from signatures with varArgs
      // TODO: simplify this loop or move it to a separate function
      for (i = 0; i < signatures.length; i++) {
        signature = signatures[i];

        if (signature.varArgs) {
          var index = signature.params.length - 1;
          var param = signature.params[index];

          var t = 0;
          while (t < param.types.length) {
            if (param.conversions[t]) {
              var type = param.types[t];

              for (var j = 0; j < signatures.length; j++) {
                var other = signatures[j];
                var p = other.params[index];

                if (other !== signature &&
                    p &&
                    contains(p.types, type) && !p.conversions[index]) {
                  // this (conversion) type already exists, remove it
                  param.types.splice(t, 1);
                  param.conversions.splice(t, 1);
                  t--;
                  break;
                }
              }
            }
            t++;
          }
        }
      }

      return signatures;
    }

    /**
     * Filter all any type signatures
     * @param {Signature[]} signatures
     * @return {Signature[]} Returns only any type signatures
     */
    function filterAnyTypeSignatures (signatures) {
      var filtered = [];

      for (var i = 0; i < signatures.length; i++) {
        if (signatures[i].anyType) {
          filtered.push(signatures[i]);
        }
      }

      return filtered;
    }

    /**
     * create a map with normalized signatures as key and the function as value
     * @param {Signature[]} signatures   An array with split signatures
     * @return {Object.<string, Function>} Returns a map with normalized
     *                                     signatures as key, and the function
     *                                     as value.
     */
    function mapSignatures(signatures) {
      var normalized = {};

      for (var i = 0; i < signatures.length; i++) {
        var signature = signatures[i];
        if (signature.fn && !signature.hasConversions()) {
          var params = signature.params.join(',');
          normalized[params] = signature.fn;
        }
      }

      return normalized;
    }

    /**
     * Parse signatures recursively in a node tree.
     * @param {Signature[]} signatures  Array with expanded signatures
     * @param {Param[]} path            Traversed path of parameter types
     * @param {Signature[]} anys
     * @return {Node}                   Returns a node tree
     */
    function parseTree(signatures, path, anys) {
      var i, signature;
      var index = path.length;
      var nodeSignature;

      var filtered = [];
      for (i = 0; i < signatures.length; i++) {
        signature = signatures[i];

        // filter the first signature with the correct number of params
        if (signature.params.length === index && !nodeSignature) {
          nodeSignature = signature;
        }

        if (signature.params[index] != undefined) {
          filtered.push(signature);
        }
      }

      // sort the filtered signatures by param
      filtered.sort(function (a, b) {
        return Param.compare(a.params[index], b.params[index]);
      });

      // recurse over the signatures
      var entries = [];
      for (i = 0; i < filtered.length; i++) {
        signature = filtered[i];
        // group signatures with the same param at current index
        var param = signature.params[index];

        // TODO: replace the next filter loop
        var existing = entries.filter(function (entry) {
          return entry.param.overlapping(param);
        })[0];

        //var existing;
        //for (var j = 0; j < entries.length; j++) {
        //  if (entries[j].param.overlapping(param)) {
        //    existing = entries[j];
        //    break;
        //  }
        //}

        if (existing) {
          if (existing.param.varArgs) {
            throw new Error('Conflicting types "' + existing.param + '" and "' + param + '"');
          }
          existing.signatures.push(signature);
        }
        else {
          entries.push({
            param: param,
            signatures: [signature]
          });
        }
      }

      // find all any type signature that can still match our current path
      var matchingAnys = [];
      for (i = 0; i < anys.length; i++) {
        if (anys[i].paramsStartWith(path)) {
          matchingAnys.push(anys[i]);
        }
      }

      // see if there are any type signatures that don't match any of the
      // signatures that we have in our tree, i.e. we have alternative
      // matching signature(s) outside of our current tree and we should
      // fall through to them instead of throwing an exception
      var fallThrough = false;
      for (i = 0; i < matchingAnys.length; i++) {
        if (!contains(signatures, matchingAnys[i])) {
          fallThrough = true;
          break;
        }
      }

      // parse the childs
      var childs = new Array(entries.length);
      for (i = 0; i < entries.length; i++) {
        var entry = entries[i];
        childs[i] = parseTree(entry.signatures, path.concat(entry.param), matchingAnys);
      }

      return new Node(path, nodeSignature, childs, fallThrough);
    }

    /**
     * Generate an array like ['arg0', 'arg1', 'arg2']
     * @param {number} count Number of arguments to generate
     * @returns {Array} Returns an array with argument names
     */
    function getArgs(count) {
      // create an array with all argument names
      var args = [];
      for (var i = 0; i < count; i++) {
        args[i] = 'arg' + i;
      }

      return args;
    }

    /**
     * Compose a function from sub-functions each handling a single type signature.
     * Signatures:
     *   typed(signature: string, fn: function)
     *   typed(name: string, signature: string, fn: function)
     *   typed(signatures: Object.<string, function>)
     *   typed(name: string, signatures: Object.<string, function>)
     *
     * @param {string | null} name
     * @param {Object.<string, Function>} signatures
     * @return {Function} Returns the typed function
     * @private
     */
    function _typed(name, signatures) {
      var refs = new Refs();

      // parse signatures, expand them
      var _signatures = parseSignatures(signatures);
      if (_signatures.length == 0) {
        throw new Error('No signatures provided');
      }

      // filter all any type signatures
      var anys = filterAnyTypeSignatures(_signatures);

      // parse signatures into a node tree
      var node = parseTree(_signatures, [], anys);

      //var util = require('util');
      //console.log('ROOT');
      //console.log(util.inspect(node, { depth: null }));

      // generate code for the typed function
      // safeName is a conservative replacement of characters 
      // to prevend being able to inject JS code at the place of the function name 
      // the name is useful for stack trackes therefore we want have it there
      var code = [];
      var safeName = (name || '').replace(/[^a-zA-Z0-9_$]/g, '_');
      var args = getArgs(maxParams(_signatures));
      code.push('function ' + safeName + '(' + args.join(', ') + ') {');
      code.push('  "use strict";');
      code.push('  var name = ' + JSON.stringify(name || '') + ';');
      code.push(node.toCode(refs, '  ', false));
      code.push('}');

      // generate body for the factory function
      var body = [
        refs.toCode(),
        'return ' + code.join('\n')
      ].join('\n');

      // evaluate the JavaScript code and attach function references
      var factory = (new Function(refs.name, 'createError', body));
      var fn = factory(refs, createError);

      //console.log('FN\n' + fn.toString()); // TODO: cleanup

      // attach the signatures with sub-functions to the constructed function
      fn.signatures = mapSignatures(_signatures);

      return fn;
    }

    /**
     * Calculate the maximum number of parameters in givens signatures
     * @param {Signature[]} signatures
     * @returns {number} The maximum number of parameters
     */
    function maxParams(signatures) {
      var max = 0;

      for (var i = 0; i < signatures.length; i++) {
        var len = signatures[i].params.length;
        if (len > max) {
          max = len;
        }
      }

      return max;
    }

    /**
     * Get the type of a value
     * @param {*} x
     * @returns {string} Returns a string with the type of value
     */
    function getTypeOf(x) {
      var obj;

      for (var i = 0; i < typed.types.length; i++) {
        var entry = typed.types[i];

        if (entry.name === 'Object') {
          // Array and Date are also Object, so test for Object afterwards
          obj = entry;
        }
        else {
          if (entry.test(x)) return entry.name;
        }
      }

      // at last, test whether an object
      if (obj && obj.test(x)) return obj.name;

      return 'unknown';
    }

    /**
     * Test whether an array contains some item
     * @param {Array} array
     * @param {*} item
     * @return {boolean} Returns true if array contains item, false if not.
     */
    function contains(array, item) {
      return array.indexOf(item) !== -1;
    }

    /**
     * Returns the last item in the array
     * @param {Array} array
     * @return {*} item
     */
    function last (array) {
      return array[array.length - 1];
    }

    // data type tests
    var types = [
      { name: 'number',    test: function (x) { return typeof x === 'number' } },
      { name: 'string',    test: function (x) { return typeof x === 'string' } },
      { name: 'boolean',   test: function (x) { return typeof x === 'boolean' } },
      { name: 'Function',  test: function (x) { return typeof x === 'function'} },
      { name: 'Array',     test: Array.isArray },
      { name: 'Date',      test: function (x) { return x instanceof Date } },
      { name: 'RegExp',    test: function (x) { return x instanceof RegExp } },
      { name: 'Object',    test: function (x) { return typeof x === 'object' } },
      { name: 'null',      test: function (x) { return x === null } },
      { name: 'undefined', test: function (x) { return x === undefined } }
    ];

    // configuration
    var config = {};

    // type conversions. Order is important
    var conversions = [];

    // types to be ignored
    var ignore = [];

    // temporary object for holding types and conversions, for constructing
    // the `typed` function itself
    // TODO: find a more elegant solution for this
    var typed = {
      config: config,
      types: types,
      conversions: conversions,
      ignore: ignore
    };

    /**
     * Construct the typed function itself with various signatures
     *
     * Signatures:
     *
     *   typed(signatures: Object.<string, function>)
     *   typed(name: string, signatures: Object.<string, function>)
     */
    typed = _typed('typed', {
      'Object': function (signatures) {
        var fns = [];
        for (var signature in signatures) {
          if (signatures.hasOwnProperty(signature)) {
            fns.push(signatures[signature]);
          }
        }
        var name = getName(fns);

        return _typed(name, signatures);
      },
      'string, Object': _typed,
      // TODO: add a signature 'Array.<function>'
      '...Function': function (fns) {
        var err;
        var name = getName(fns);
        var signatures = {};

        for (var i = 0; i < fns.length; i++) {
          var fn = fns[i];

          // test whether this is a typed-function
          if (!(typeof fn.signatures === 'object')) {
            err = new TypeError('Function is no typed-function (index: ' + i + ')');
            err.data = {index: i};
            throw err;
          }

          // merge the signatures
          for (var signature in fn.signatures) {
            if (fn.signatures.hasOwnProperty(signature)) {
              if (signatures.hasOwnProperty(signature)) {
                if (fn.signatures[signature] !== signatures[signature]) {
                  err = new Error('Signature "' + signature + '" is defined twice');
                  err.data = {signature: signature};
                  throw err;
                }
                // else: both signatures point to the same function, that's fine
              }
              else {
                signatures[signature] = fn.signatures[signature];
              }
            }
          }
        }

        return _typed(name, signatures);
      }
    });

    /**
     * Find a specific signature from a (composed) typed function, for
     * example:
     *
     *   typed.find(fn, ['number', 'string'])
     *   typed.find(fn, 'number, string')
     *
     * Function find only only works for exact matches.
     *
     * @param {Function} fn                   A typed-function
     * @param {string | string[]} signature   Signature to be found, can be
     *                                        an array or a comma separated string.
     * @return {Function}                     Returns the matching signature, or
     *                                        throws an errror when no signature
     *                                        is found.
     */
    function find (fn, signature) {
      if (!fn.signatures) {
        throw new TypeError('Function is no typed-function');
      }

      // normalize input
      var arr;
      if (typeof signature === 'string') {
        arr = signature.split(',');
        for (var i = 0; i < arr.length; i++) {
          arr[i] = arr[i].trim();
        }
      }
      else if (Array.isArray(signature)) {
        arr = signature;
      }
      else {
        throw new TypeError('String array or a comma separated string expected');
      }

      var str = arr.join(',');

      // find an exact match
      var match = fn.signatures[str];
      if (match) {
        return match;
      }

      // TODO: extend find to match non-exact signatures

      throw new TypeError('Signature not found (signature: ' + (fn.name || 'unnamed') + '(' + arr.join(', ') + '))');
    }

    /**
     * Convert a given value to another data type.
     * @param {*} value
     * @param {string} type
     */
    function convert (value, type) {
      var from = getTypeOf(value);

      // check conversion is needed
      if (type === from) {
        return value;
      }

      for (var i = 0; i < typed.conversions.length; i++) {
        var conversion = typed.conversions[i];
        if (conversion.from === from && conversion.to === type) {
          return conversion.convert(value);
        }
      }

      throw new Error('Cannot convert from ' + from + ' to ' + type);
    }

    // attach types and conversions to the final `typed` function
    typed.config = config;
    typed.types = types;
    typed.conversions = conversions;
    typed.ignore = ignore;
    typed.create = create;
    typed.find = find;
    typed.convert = convert;

    // add a type
    typed.addType = function (type) {
      if (!type || typeof type.name !== 'string' || typeof type.test !== 'function') {
        throw new TypeError('Object with properties {name: string, test: function} expected');
      }

      typed.types.push(type);
    };

    // add a conversion
    typed.addConversion = function (conversion) {
      if (!conversion
          || typeof conversion.from !== 'string'
          || typeof conversion.to !== 'string'
          || typeof conversion.convert !== 'function') {
        throw new TypeError('Object with properties {from: string, to: string, convert: function} expected');
      }

      typed.conversions.push(conversion);
    };

    return typed;
  }

  return create();
}));
});

var number = createCommonjsModule(function (module, exports) {
'use strict';

/**
 * @typedef {{sign: '+' | '-' | '', coefficients: number[], exponent: number}} SplitValue
 */

/**
 * Test whether value is a number
 * @param {*} value
 * @return {boolean} isNumber
 */
exports.isNumber = function(value) {
  return typeof value === 'number';
};

/**
 * Check if a number is integer
 * @param {number | boolean} value
 * @return {boolean} isInteger
 */
exports.isInteger = function(value) {
  return isFinite(value)
      ? (value == Math.round(value))
      : false;
  // Note: we use ==, not ===, as we can have Booleans as well
};

/**
 * Calculate the sign of a number
 * @param {number} x
 * @returns {*}
 */
exports.sign = Math.sign || function(x) {
  if (x > 0) {
    return 1;
  }
  else if (x < 0) {
    return -1;
  }
  else {
    return 0;
  }
};

/**
 * Convert a number to a formatted string representation.
 *
 * Syntax:
 *
 *    format(value)
 *    format(value, options)
 *    format(value, precision)
 *    format(value, fn)
 *
 * Where:
 *
 *    {number} value   The value to be formatted
 *    {Object} options An object with formatting options. Available options:
 *                     {string} notation
 *                         Number notation. Choose from:
 *                         'fixed'          Always use regular number notation.
 *                                          For example '123.40' and '14000000'
 *                         'exponential'    Always use exponential notation.
 *                                          For example '1.234e+2' and '1.4e+7'
 *                         'engineering'    Always use engineering notation.
 *                                          For example '123.4e+0' and '14.0e+6'
 *                         'auto' (default) Regular number notation for numbers
 *                                          having an absolute value between
 *                                          `lower` and `upper` bounds, and uses
 *                                          exponential notation elsewhere.
 *                                          Lower bound is included, upper bound
 *                                          is excluded.
 *                                          For example '123.4' and '1.4e7'.
 *                     {number} precision   A number between 0 and 16 to round
 *                                          the digits of the number.
 *                                          In case of notations 'exponential' and
 *                                          'auto', `precision` defines the total
 *                                          number of significant digits returned
 *                                          and is undefined by default.
 *                                          In case of notation 'fixed',
 *                                          `precision` defines the number of
 *                                          significant digits after the decimal
 *                                          point, and is 0 by default.
 *                     {Object} exponential An object containing two parameters,
 *                                          {number} lower and {number} upper,
 *                                          used by notation 'auto' to determine
 *                                          when to return exponential notation.
 *                                          Default values are `lower=1e-3` and
 *                                          `upper=1e5`.
 *                                          Only applicable for notation `auto`.
 *    {Function} fn    A custom formatting function. Can be used to override the
 *                     built-in notations. Function `fn` is called with `value` as
 *                     parameter and must return a string. Is useful for example to
 *                     format all values inside a matrix in a particular way.
 *
 * Examples:
 *
 *    format(6.4);                                        // '6.4'
 *    format(1240000);                                    // '1.24e6'
 *    format(1/3);                                        // '0.3333333333333333'
 *    format(1/3, 3);                                     // '0.333'
 *    format(21385, 2);                                   // '21000'
 *    format(12.071, {notation: 'fixed'});                // '12'
 *    format(2.3,    {notation: 'fixed', precision: 2});  // '2.30'
 *    format(52.8,   {notation: 'exponential'});          // '5.28e+1'
 *    format(12345678, {notation: 'engineering'});        // '12.345678e+6'
 *
 * @param {number} value
 * @param {Object | Function | number} [options]
 * @return {string} str The formatted value
 */
exports.format = function(value, options) {
  if (typeof options === 'function') {
    // handle format(value, fn)
    return options(value);
  }

  // handle special cases
  if (value === Infinity) {
    return 'Infinity';
  }
  else if (value === -Infinity) {
    return '-Infinity';
  }
  else if (isNaN(value)) {
    return 'NaN';
  }

  // default values for options
  var notation = 'auto';
  var precision = undefined;

  if (options) {
    // determine notation from options
    if (options.notation) {
      notation = options.notation;
    }

    // determine precision from options
    if (exports.isNumber(options)) {
      precision = options;
    }
    else if (options.precision) {
      precision = options.precision;
    }
  }

  // handle the various notations
  switch (notation) {
    case 'fixed':
      return exports.toFixed(value, precision);

    case 'exponential':
      return exports.toExponential(value, precision);

    case 'engineering':
      return exports.toEngineering(value, precision);

    case 'auto':
      return exports
          .toPrecision(value, precision, options && options.exponential)

          // remove trailing zeros after the decimal point
          .replace(/((\.\d*?)(0+))($|e)/, function () {
            var digits = arguments[2];
            var e = arguments[4];
            return (digits !== '.') ? digits + e : e;
          });

    default:
      throw new Error('Unknown notation "' + notation + '". ' +
          'Choose "auto", "exponential", or "fixed".');
  }
};

/**
 * Split a number into sign, coefficients, and exponent
 * @param {number | string} value
 * @return {SplitValue}
 *              Returns an object containing sign, coefficients, and exponent
 */
exports.splitNumber = function (value) {
  // parse the input value
  var match = String(value).toLowerCase().match(/^0*?(-?)(\d+\.?\d*)(e([+-]?\d+))?$/);
  if (!match) {
    throw new SyntaxError('Invalid number ' + value);
  }

  var sign         = match[1];
  var digits       = match[2];
  var exponent     = parseFloat(match[4] || '0');

  var dot = digits.indexOf('.');
  exponent += (dot !== -1) ? (dot - 1) : (digits.length - 1);

  var coefficients = digits
      .replace('.', '')  // remove the dot (must be removed before removing leading zeros)
      .replace(/^0*/, function (zeros) {
        // remove leading zeros, add their count to the exponent
        exponent -= zeros.length;
        return '';
      })
      .replace(/0*$/, '') // remove trailing zeros
      .split('')
      .map(function (d) {
        return parseInt(d);
      });

  if (coefficients.length === 0) {
    coefficients.push(0);
    exponent++;
  }

  return {
    sign: sign,
    coefficients: coefficients,
    exponent: exponent
  };
};


/**
 * Format a number in engineering notation. Like '1.23e+6', '2.3e+0', '3.500e-3'
 * @param {number | string} value
 * @param {number} [precision=0]        Optional number of decimals after the
 *                                      decimal point. Zero by default.
 */
exports.toEngineering = function (value, precision) {
  if (isNaN(value) || !isFinite(value)) {
    return String(value);
  }
  
  var rounded = exports.roundDigits(exports.splitNumber(value), precision);

  var e = rounded.exponent;
  var c = rounded.coefficients;

  // find nearest lower multiple of 3 for exponent
  var newExp = e % 3 === 0 ? e : (e < 0 ? (e - 3) - (e % 3) : e - (e % 3));

  // concatenate coefficients with necessary zeros
  var significandsDiff = e >= 0 ? e : Math.abs(newExp);

  // add zeros if necessary (for ex: 1e+8)
  if (c.length - 1 < significandsDiff) c = c.concat(zeros(significandsDiff - (c.length - 1)));

  // find difference in exponents
  var expDiff = Math.abs(e - newExp);

  var decimalIdx = 1;

  // push decimal index over by expDiff times
  while (--expDiff >= 0) decimalIdx++;

  // if all coefficient values are zero after the decimal point, don't add a decimal value.
  // otherwise concat with the rest of the coefficients
  var decimals = c.slice(decimalIdx).join('');
  var decimalVal = decimals.match(/[1-9]/) ? ('.' + decimals) : '';

  var str = c.slice(0, decimalIdx).join('') +
      decimalVal +
      'e' + (e >= 0 ? '+' : '') + newExp.toString();
  return rounded.sign + str;
};

/**
 * Format a number with fixed notation.
 * @param {number | string} value
 * @param {number} [precision=0]        Optional number of decimals after the
 *                                      decimal point. Zero by default.
 */
exports.toFixed = function (value, precision) {
  if (isNaN(value) || !isFinite(value)) {
    return String(value);
  }

  var splitValue = exports.splitNumber(value);
  var rounded = exports.roundDigits(splitValue, splitValue.exponent + 1 + (precision || 0));
  var c = rounded.coefficients;
  var p = rounded.exponent + 1; // exponent may have changed

  // append zeros if needed
  var pp = p + (precision || 0);
  if (c.length < pp) {
    c = c.concat(zeros(pp - c.length));
  }

  // prepend zeros if needed
  if (p < 0) {
    c = zeros(-p + 1).concat(c);
    p = 1;
  }

  // insert a dot if needed
  if (precision) {
    c.splice(p, 0, (p === 0) ? '0.' : '.');
  }

  return rounded.sign + c.join('');
};

/**
 * Format a number in exponential notation. Like '1.23e+5', '2.3e+0', '3.500e-3'
 * @param {number | string} value
 * @param {number} [precision]  Number of digits in formatted output.
 *                              If not provided, the maximum available digits
 *                              is used.
 */
exports.toExponential = function (value, precision) {
  if (isNaN(value) || !isFinite(value)) {
    return String(value);
  }

  // round if needed, else create a clone
  var split = exports.splitNumber(value);
  var rounded = precision ? exports.roundDigits(split, precision) : split;
  var c = rounded.coefficients;
  var e = rounded.exponent;

  // append zeros if needed
  if (c.length < precision) {
    c = c.concat(zeros(precision - c.length));
  }

  // format as `C.CCCe+EEE` or `C.CCCe-EEE`
  var first = c.shift();
  return rounded.sign + first + (c.length > 0 ? ('.' + c.join('')) : '') +
      'e' + (e >= 0 ? '+' : '') + e;
};

/**
 * Format a number with a certain precision
 * @param {number | string} value
 * @param {number} [precision=undefined] Optional number of digits.
 * @param {{lower: number | undefined, upper: number | undefined}} [options]
 *                                       By default:
 *                                         lower = 1e-3 (excl)
 *                                         upper = 1e+5 (incl)
 * @return {string}
 */
exports.toPrecision = function (value, precision, options) {
  if (isNaN(value) || !isFinite(value)) {
    return String(value);
  }

  // determine lower and upper bound for exponential notation.
  var lower = (options && options.lower !== undefined) ? options.lower : 1e-3;
  var upper = (options && options.upper !== undefined) ? options.upper : 1e+5;

  var split = exports.splitNumber(value);
  var abs = Math.abs(Math.pow(10, split.exponent));
  if (abs < lower || abs >= upper) {
    // exponential notation
    return exports.toExponential(value, precision);
  }
  else {
    var rounded = precision ? exports.roundDigits(split, precision) : split;
    var c = rounded.coefficients;
    var e = rounded.exponent;

    // append trailing zeros
    if (c.length < precision) {
      c = c.concat(zeros(precision - c.length));
    }

    // append trailing zeros
    // TODO: simplify the next statement
    c = c.concat(zeros(e - c.length + 1 +
        (c.length < precision ? precision - c.length : 0)));

    // prepend zeros
    c = zeros(-e).concat(c);

    var dot = e > 0 ? e : 0;
    if (dot < c.length - 1) {
      c.splice(dot + 1, 0, '.');
    }

    return rounded.sign + c.join('');
  }
};

/**
 * Round the number of digits of a number *
 * @param {SplitValue} split       A value split with .splitNumber(value)
 * @param {number} precision  A positive integer
 * @return {SplitValue}
 *              Returns an object containing sign, coefficients, and exponent
 *              with rounded digits
 */
exports.roundDigits = function (split, precision) {
  // create a clone
  var rounded = {
    sign: split.sign,
    coefficients: split.coefficients,
    exponent: split.exponent
  };
  var c = rounded.coefficients;

  // prepend zeros if needed
  while (precision <= 0) {
    c.unshift(0);
    rounded.exponent++;
    precision++;
  }

  if (c.length > precision) {
    var removed = c.splice(precision, c.length - precision);

    if (removed[0] >= 5) {
      var i = precision - 1;
      c[i]++;
      while (c[i] === 10) {
        c.pop();
        if (i === 0) {
          c.unshift(0);
          rounded.exponent++;
          i++;
        }
        i--;
        c[i]++;
      }
    }
  }

  return rounded;
};

/**
 * Create an array filled with zeros.
 * @param {number} length
 * @return {Array}
 */
function zeros(length) {
  var arr = [];
  for (var i = 0; i < length; i++) {
    arr.push(0);
  }
  return arr;
}

/**
 * Count the number of significant digits of a number.
 *
 * For example:
 *   2.34 returns 3
 *   0.0034 returns 2
 *   120.5e+30 returns 4
 *
 * @param {number} value
 * @return {number} digits   Number of significant digits
 */
exports.digits = function(value) {
  return value
      .toExponential()
      .replace(/e.*$/, '')          // remove exponential notation
      .replace( /^0\.?0*|\./, '')   // remove decimal point and leading zeros
      .length
};

/**
 * Minimum number added to one that makes the result different than one
 */
exports.DBL_EPSILON = Number.EPSILON || 2.2204460492503130808472633361816E-16;

/**
 * Compares two floating point numbers.
 * @param {number} x          First value to compare
 * @param {number} y          Second value to compare
 * @param {number} [epsilon]  The maximum relative difference between x and y
 *                            If epsilon is undefined or null, the function will
 *                            test whether x and y are exactly equal.
 * @return {boolean} whether the two numbers are nearly equal
*/
exports.nearlyEqual = function(x, y, epsilon) {
  // if epsilon is null or undefined, test whether x and y are exactly equal
  if (epsilon == null) {
    return x == y;
  }

  // use "==" operator, handles infinities
  if (x == y) {
    return true;
  }

  // NaN
  if (isNaN(x) || isNaN(y)) {
    return false;
  }

  // at this point x and y should be finite
  if(isFinite(x) && isFinite(y)) {
    // check numbers are very close, needed when comparing numbers near zero
    var diff = Math.abs(x - y);
    if (diff < exports.DBL_EPSILON) {
      return true;
    }
    else {
      // use relative error
      return diff <= Math.max(Math.abs(x), Math.abs(y)) * epsilon;
    }
  }

  // Infinite and Number or negative Infinite and positive Infinite cases
  return false;
};
});

/**
 * Test whether a value is a Matrix
 * @param {*} x
 * @returns {boolean} returns true with input is a Matrix
 *                    (like a DenseMatrix or SparseMatrix)
 */
var isMatrix = function isMatrix (x) {
  return x && x.constructor.prototype.isMatrix || false;
};

var digits = number.digits;



// returns a new instance of typed-function
var createTyped = function () {
  // initially, return the original instance of typed-function
  // consecutively, return a new instance from typed.create.
  createTyped = typedFunction.create;
  return typedFunction;
};

/**
 * Factory function for creating a new typed instance
 * @param {Object} type   Object with data types like Complex and BigNumber
 * @returns {Function}
 */
var create$2 = function create(type) {
  // TODO: typed-function must be able to silently ignore signatures with unknown data types

  // type checks for all known types
  //
  // note that:
  //
  // - check by duck-typing on a property like `isUnit`, instead of checking instanceof.
  //   instanceof cannot be used because that would not allow to pass data from
  //   one instance of math.js to another since each has it's own instance of Unit.
  // - check the `isUnit` property via the constructor, so there will be no
  //   matches for "fake" instances like plain objects with a property `isUnit`.
  //   That is important for security reasons.
  // - It must not be possible to override the type checks used internally,
  //   for security reasons, so these functions are not exposed in the expression
  //   parser.
  type.isNumber = function (x) { return typeof x === 'number' };
  type.isComplex = function (x) { return type.Complex && x instanceof type.Complex || false };
  type.isBigNumber = isBigNumber;
  type.isFraction = function (x) { return type.Fraction && x instanceof type.Fraction || false };
  type.isUnit = function (x) { return x && x.constructor.prototype.isUnit || false };
  type.isString = function (x) { return typeof x === 'string' };
  type.isArray = Array.isArray;
  type.isMatrix = isMatrix;
  type.isDenseMatrix = function (x) { return x && x.isDenseMatrix && x.constructor.prototype.isMatrix || false };
  type.isSparseMatrix = function (x) { return x && x.isSparseMatrix && x.constructor.prototype.isMatrix || false };
  type.isRange = function (x) { return x && x.constructor.prototype.isRange || false };
  type.isIndex = function (x) { return x && x.constructor.prototype.isIndex || false };
  type.isBoolean = function (x) { return typeof x === 'boolean' };
  type.isResultSet = function (x) { return x && x.constructor.prototype.isResultSet || false };
  type.isHelp = function (x) { return x && x.constructor.prototype.isHelp || false };
  type.isFunction = function (x) { return typeof x === 'function'};
  type.isDate = function (x) { return x instanceof Date };
  type.isRegExp = function (x) { return x instanceof RegExp };
  type.isObject = function (x) { return typeof x === 'object' };
  type.isNull = function (x) { return x === null };
  type.isUndefined = function (x) { return x === undefined };

  type.isAccessorNode = function (x) { return x && x.isAccessorNode && x.constructor.prototype.isNode || false };
  type.isArrayNode = function (x) { return x && x.isArrayNode && x.constructor.prototype.isNode || false };
  type.isAssignmentNode = function (x) { return x && x.isAssignmentNode && x.constructor.prototype.isNode || false };
  type.isBlockNode = function (x) { return x && x.isBlockNode && x.constructor.prototype.isNode || false };
  type.isConditionalNode = function (x) { return x && x.isConditionalNode && x.constructor.prototype.isNode || false };
  type.isConstantNode = function (x) { return x && x.isConstantNode && x.constructor.prototype.isNode || false };
  type.isFunctionAssignmentNode = function (x) { return x && x.isFunctionAssignmentNode && x.constructor.prototype.isNode || false };
  type.isFunctionNode = function (x) { return x && x.isFunctionNode && x.constructor.prototype.isNode || false };
  type.isIndexNode = function (x) { return x && x.isIndexNode && x.constructor.prototype.isNode || false };
  type.isNode = function (x) { return x && x.isNode && x.constructor.prototype.isNode || false };
  type.isObjectNode = function (x) { return x && x.isObjectNode && x.constructor.prototype.isNode || false };
  type.isOperatorNode = function (x) { return x && x.isOperatorNode && x.constructor.prototype.isNode || false };
  type.isParenthesisNode = function (x) { return x && x.isParenthesisNode && x.constructor.prototype.isNode || false };
  type.isRangeNode = function (x) { return x && x.isRangeNode && x.constructor.prototype.isNode || false };
  type.isSymbolNode = function (x) { return x && x.isSymbolNode && x.constructor.prototype.isNode || false };

  type.isChain = function (x) { return x && x.constructor.prototype.isChain || false };

  // get a new instance of typed-function
  var typed = createTyped();

  // define all types. The order of the types determines in which order function
  // arguments are type-checked (so for performance it's important to put the
  // most used types first).
  typed.types = [
    { name: 'number',          test: type.isNumber },
    { name: 'Complex',         test: type.isComplex },
    { name: 'BigNumber',       test: type.isBigNumber },
    { name: 'Fraction',        test: type.isFraction },
    { name: 'Unit',            test: type.isUnit },
    { name: 'string',          test: type.isString },
    { name: 'Array',           test: type.isArray },
    { name: 'Matrix',          test: type.isMatrix },
    { name: 'DenseMatrix',     test: type.isDenseMatrix },
    { name: 'SparseMatrix',    test: type.isSparseMatrix },
    { name: 'Range',           test: type.isRange },
    { name: 'Index',           test: type.isIndex },
    { name: 'boolean',         test: type.isBoolean },
    { name: 'ResultSet',       test: type.isResultSet },
    { name: 'Help',            test: type.isHelp },
    { name: 'function',        test: type.isFunction },
    { name: 'Date',            test: type.isDate },
    { name: 'RegExp',          test: type.isRegExp },
    { name: 'Object',          test: type.isObject },
    { name: 'null',            test: type.isNull },
    { name: 'undefined',       test: type.isUndefined },

    { name: 'OperatorNode',    test: type.isOperatorNode },
    { name: 'ConstantNode',    test: type.isConstantNode },
    { name: 'SymbolNode',      test: type.isSymbolNode },
    { name: 'ParenthesisNode', test: type.isParenthesisNode },
    { name: 'FunctionNode',    test: type.isFunctionNode },
    { name: 'FunctionAssignmentNode',    test: type.isFunctionAssignmentNode },
    { name: 'ArrayNode',                 test: type.isArrayNode },
    { name: 'AssignmentNode',            test: type.isAssignmentNode },
    { name: 'BlockNode',                 test: type.isBlockNode },
    { name: 'ConditionalNode',           test: type.isConditionalNode },
    { name: 'IndexNode',                 test: type.isIndexNode },
    { name: 'RangeNode',                 test: type.isRangeNode },
    { name: 'Node',                      test: type.isNode }
  ];

  // TODO: add conversion from BigNumber to number?
  typed.conversions = [
    {
      from: 'number',
      to: 'BigNumber',
      convert: function (x) {
        // note: conversion from number to BigNumber can fail if x has >15 digits
        if (digits(x) > 15) {
          throw new TypeError('Cannot implicitly convert a number with >15 significant digits to BigNumber ' +
          '(value: ' + x + '). ' +
          'Use function bignumber(x) to convert to BigNumber.');
        }
        return new type.BigNumber(x);
      }
    }, {
      from: 'number',
      to: 'Complex',
      convert: function (x) {
        return new type.Complex(x, 0);
      }
    }, {
      from: 'number',
      to: 'string',
      convert: function (x) {
        return x + '';
      }
    }, {
      from: 'BigNumber',
      to: 'Complex',
      convert: function (x) {
        return new type.Complex(x.toNumber(), 0);
      }
    }, {
      from: 'Fraction',
      to: 'BigNumber',
      convert: function (x) {
        throw new TypeError('Cannot implicitly convert a Fraction to BigNumber or vice versa. ' +
            'Use function bignumber(x) to convert to BigNumber or fraction(x) to convert to Fraction.');
      }
    }, {
      from: 'Fraction',
      to: 'Complex',
      convert: function (x) {
        return new type.Complex(x.valueOf(), 0);
      }
    }, {
      from: 'number',
      to: 'Fraction',
      convert: function (x) {
        var f = new type.Fraction(x);
        if (f.valueOf() !== x) {
          throw new TypeError('Cannot implicitly convert a number to a Fraction when there will be a loss of precision ' +
              '(value: ' + x + '). ' +
              'Use function fraction(x) to convert to Fraction.');
        }
        return new type.Fraction(x);
      }
    }, {
    // FIXME: add conversion from Fraction to number, for example for `sqrt(fraction(1,3))`
    //  from: 'Fraction',
    //  to: 'number',
    //  convert: function (x) {
    //    return x.valueOf();
    //  }
    //}, {
      from: 'string',
      to: 'number',
      convert: function (x) {
        var n = Number(x);
        if (isNaN(n)) {
          throw new Error('Cannot convert "' + x + '" to a number');
        }
        return n;
      }
    }, {
      from: 'string',
      to: 'BigNumber',
      convert: function (x) {
        try {
          return new type.BigNumber(x);
        }
        catch (err) {
          throw new Error('Cannot convert "' + x + '" to BigNumber');
        }
      }
    }, {
      from: 'string',
      to: 'Fraction',
      convert: function (x) {
        try {
          return new type.Fraction(x);
        }
        catch (err) {
          throw new Error('Cannot convert "' + x + '" to Fraction');
        }
      }
    }, {
      from: 'string',
      to: 'Complex',
      convert: function (x) {
        try {
          return new type.Complex(x);
        }
        catch (err) {
          throw new Error('Cannot convert "' + x + '" to Complex');
        }
      }
    }, {
      from: 'boolean',
      to: 'number',
      convert: function (x) {
        return +x;
      }
    }, {
      from: 'boolean',
      to: 'BigNumber',
      convert: function (x) {
        return new type.BigNumber(+x);
      }
    }, {
      from: 'boolean',
      to: 'Fraction',
      convert: function (x) {
        return new type.Fraction(+x);
      }
    }, {
      from: 'boolean',
      to: 'string',
      convert: function (x) {
        return +x;
      }
    }, {
      from: 'null',
      to: 'number',
      convert: function () {
        return 0;
      }
    }, {
      from: 'null',
      to: 'string',
      convert: function () {
        return 'null';
      }
    }, {
      from: 'null',
      to: 'BigNumber',
      convert: function () {
        return new type.BigNumber(0);
      }
    }, {
      from: 'null',
      to: 'Fraction',
      convert: function () {
        return new type.Fraction(0);
      }
    }, {
      from: 'Array',
      to: 'Matrix',
      convert: function (array) {
        // TODO: how to decide on the right type of matrix to create?
        return new type.DenseMatrix(array);
      }
    }, {
      from: 'Matrix',
      to: 'Array',
      convert: function (matrix) {
        return matrix.valueOf();
      }
    }
  ];

  return typed;
};

var typed = {
	create: create$2
};

function E () {
  // Keep this empty so it's easier to inherit from
  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
}

E.prototype = {
  on: function (name, callback, ctx) {
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx
    });

    return this;
  },

  once: function (name, callback, ctx) {
    var self = this;
    function listener () {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    }

    listener._ = callback;
    return this.on(name, listener, ctx);
  },

  emit: function (name) {
    var data = [].slice.call(arguments, 1);
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    var evts = e[name];
    var liveEvents = [];

    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    // Remove event from queue to prevent memory leak
    // Suggested by https://github.com/lazd
    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

    (liveEvents.length)
      ? e[name] = liveEvents
      : delete e[name];

    return this;
  }
};

var tinyEmitter = E;

/**
 * Extend given object with emitter functions `on`, `off`, `once`, `emit`
 * @param {Object} obj
 * @return {Object} obj
 */
var mixin = function (obj) {
  // create event emitter
  var emitter = new tinyEmitter();

  // bind methods to obj (we don't want to expose the emitter.e Array...)
  obj.on   = emitter.on.bind(emitter);
  obj.off  = emitter.off.bind(emitter);
  obj.once = emitter.once.bind(emitter);
  obj.emit = emitter.emit.bind(emitter);

  return obj;
};

var emitter = {
	mixin: mixin
};

/**
 * Create a syntax error with the message:
 *     'Wrong number of arguments in function <fn> (<count> provided, <min>-<max> expected)'
 * @param {string} fn     Function name
 * @param {number} count  Actual argument count
 * @param {number} min    Minimum required argument count
 * @param {number} [max]  Maximum required argument count
 * @extends Error
 */
function ArgumentsError(fn, count, min, max) {
  if (!(this instanceof ArgumentsError)) {
    throw new SyntaxError('Constructor must be called with the new operator');
  }

  this.fn = fn;
  this.count = count;
  this.min = min;
  this.max = max;

  this.message = 'Wrong number of arguments in function ' + fn +
      ' (' + count + ' provided, ' +
      min + ((max != undefined) ? ('-' + max) : '') + ' expected)';

  this.stack = (new Error()).stack;
}

ArgumentsError.prototype = new Error();
ArgumentsError.prototype.constructor = Error;
ArgumentsError.prototype.name = 'ArgumentsError';
ArgumentsError.prototype.isArgumentsError = true;

var ArgumentsError_1 = ArgumentsError;

var lazy = object.lazy;
var isFactory$1 = object.isFactory;
var traverse = object.traverse;


function factory (type, config, load, typed, math) {
  /**
   * Import functions from an object or a module
   *
   * Syntax:
   *
   *    math.import(object)
   *    math.import(object, options)
   *
   * Where:
   *
   * - `object: Object`
   *   An object with functions to be imported.
   * - `options: Object` An object with import options. Available options:
   *   - `override: boolean`
   *     If true, existing functions will be overwritten. False by default.
   *   - `silent: boolean`
   *     If true, the function will not throw errors on duplicates or invalid
   *     types. False by default.
   *   - `wrap: boolean`
   *     If true, the functions will be wrapped in a wrapper function
   *     which converts data types like Matrix to primitive data types like Array.
   *     The wrapper is needed when extending math.js with libraries which do not
   *     support these data type. False by default.
   *
   * Examples:
   *
   *    // define new functions and variables
   *    math.import({
   *      myvalue: 42,
   *      hello: function (name) {
   *        return 'hello, ' + name + '!';
   *      }
   *    });
   *
   *    // use the imported function and variable
   *    math.myvalue * 2;               // 84
   *    math.hello('user');             // 'hello, user!'
   *
   *    // import the npm module 'numbers'
   *    // (must be installed first with `npm install numbers`)
   *    math.import(require('numbers'), {wrap: true});
   *
   *    math.fibonacci(7); // returns 13
   *
   * @param {Object | Array} object   Object with functions to be imported.
   * @param {Object} [options]        Import options.
   */
  function math_import(object$$1, options) {
    var num = arguments.length;
    if (num !== 1 && num !== 2) {
      throw new ArgumentsError_1('import', num, 1, 2);
    }

    if (!options) {
      options = {};
    }

    if (isFactory$1(object$$1)) {
      _importFactory(object$$1, options);
    }
    // TODO: allow a typed-function with name too
    else if (Array.isArray(object$$1)) {
      object$$1.forEach(function (entry) {
        math_import(entry, options);
      });
    }
    else if (typeof object$$1 === 'object') {
      // a map with functions
      for (var name in object$$1) {
        if (object$$1.hasOwnProperty(name)) {
          var value = object$$1[name];
          if (isSupportedType(value)) {
            _import(name, value, options);
          }
          else if (isFactory$1(object$$1)) {
            _importFactory(object$$1, options);
          }
          else {
            math_import(value, options);
          }
        }
      }
    }
    else {
      if (!options.silent) {
        throw new TypeError('Factory, Object, or Array expected');
      }
    }
  }

  /**
   * Add a property to the math namespace and create a chain proxy for it.
   * @param {string} name
   * @param {*} value
   * @param {Object} options  See import for a description of the options
   * @private
   */
  function _import(name, value, options) {
    // TODO: refactor this function, it's to complicated and contains duplicate code
    if (options.wrap && typeof value === 'function') {
      // create a wrapper around the function
      value = _wrap(value);
    }

    if (isTypedFunction(math[name]) && isTypedFunction(value)) {
      if (options.override) {
        // give the typed function the right name
        value = typed(name, value.signatures);
      }
      else {
        // merge the existing and typed function
        value = typed(math[name], value);
      }

      math[name] = value;
      _importTransform(name, value);
      math.emit('import', name, function resolver() {
        return value;
      });
      return;
    }

    if (math[name] === undefined || options.override) {
      math[name] = value;
      _importTransform(name, value);
      math.emit('import', name, function resolver() {
        return value;
      });
      return;
    }

    if (!options.silent) {
      throw new Error('Cannot import "' + name + '": already exists');
    }
  }

  function _importTransform (name, value) {
    if (value && typeof value.transform === 'function') {
      math.expression.transform[name] = value.transform;
      if (allowedInExpressions(name)) {
        math.expression.mathWithTransform[name] = value.transform;
      }
    }
    else {
      // remove existing transform
      delete math.expression.transform[name];
      if (allowedInExpressions(name)) {
        math.expression.mathWithTransform[name] = value;
      }
    }
  }

  /**
   * Create a wrapper a round an function which converts the arguments
   * to their primitive values (like convert a Matrix to Array)
   * @param {Function} fn
   * @return {Function} Returns the wrapped function
   * @private
   */
  function _wrap (fn) {
    var wrapper = function wrapper () {
      var args = [];
      for (var i = 0, len = arguments.length; i < len; i++) {
        var arg = arguments[i];
        args[i] = arg && arg.valueOf();
      }
      return fn.apply(math, args);
    };

    if (fn.transform) {
      wrapper.transform = fn.transform;
    }

    return wrapper;
  }

  /**
   * Import an instance of a factory into math.js
   * @param {{factory: Function, name: string, path: string, math: boolean}} factory
   * @param {Object} options  See import for a description of the options
   * @private
   */
  function _importFactory(factory, options) {
    if (typeof factory.name === 'string') {
      var name = factory.name;
      var existingTransform = name in math.expression.transform;
      var namespace = factory.path ? traverse(math, factory.path) : math;
      var existing = namespace.hasOwnProperty(name) ? namespace[name] : undefined;

      var resolver = function () {
        var instance = load(factory);
        if (instance && typeof instance.transform === 'function') {
          throw new Error('Transforms cannot be attached to factory functions. ' +
              'Please create a separate function for it with exports.path="expression.transform"');
        }

        if (isTypedFunction(existing) && isTypedFunction(instance)) {
          if (options.override) {
            // replace the existing typed function (nothing to do)
          }
          else {
            // merge the existing and new typed function
            instance = typed(existing, instance);
          }

          return instance;
        }

        if (existing === undefined || options.override) {
          return instance;
        }

        if (!options.silent) {
          throw new Error('Cannot import "' + name + '": already exists');
        }
      };

      if (factory.lazy !== false) {
        lazy(namespace, name, resolver);

        if (!existingTransform) {
          if (factory.path === 'expression.transform' || factoryAllowedInExpressions(factory)) {
            lazy(math.expression.mathWithTransform, name, resolver);
          }
        }
      }
      else {
        namespace[name] = resolver();

        if (!existingTransform) {
          if (factory.path === 'expression.transform' || factoryAllowedInExpressions(factory)) {
            math.expression.mathWithTransform[name] = resolver();
          }
        }
      }

      math.emit('import', name, resolver, factory.path);
    }
    else {
      // unnamed factory.
      // no lazy loading
      load(factory);
    }
  }

  /**
   * Check whether given object is a type which can be imported
   * @param {Function | number | string | boolean | null | Unit | Complex} object
   * @return {boolean}
   * @private
   */
  function isSupportedType(object$$1) {
    return typeof object$$1 === 'function'
        || typeof object$$1 === 'number'
        || typeof object$$1 === 'string'
        || typeof object$$1 === 'boolean'
        || object$$1 === null
        || (object$$1 && type.isUnit(object$$1))
        || (object$$1 && type.isComplex(object$$1))
        || (object$$1 && type.isBigNumber(object$$1))
        || (object$$1 && type.isFraction(object$$1))
        || (object$$1 && type.isMatrix(object$$1))
        || (object$$1 && Array.isArray(object$$1))
  }

  /**
   * Test whether a given thing is a typed-function
   * @param {*} fn
   * @return {boolean} Returns true when `fn` is a typed-function
   */
  function isTypedFunction (fn) {
    return typeof fn === 'function' && typeof fn.signatures === 'object';
  }

  function allowedInExpressions (name) {
    return !unsafe.hasOwnProperty(name);
  }

  function factoryAllowedInExpressions (factory) {
    return factory.path === undefined && !unsafe.hasOwnProperty(factory.name);
  }

  // namespaces and functions not available in the parser for safety reasons
  var unsafe = {
    'expression': true,
    'type': true,
    'docs': true,
    'error': true,
    'json': true,
    'chain': true // chain method not supported. Note that there is a unit chain too.
  };

  return math_import;
}

var math$1 = true; // request access to the math namespace as 5th argument of the factory function
var name = 'import';
var factory_1 = factory;
var lazy_1 = true;

var _import = {
	math: math$1,
	name: name,
	factory: factory_1,
	lazy: lazy_1
};

function factory$1 (type, config, load, typed, math) {
  var MATRIX = ['Matrix', 'Array'];                   // valid values for option matrix
  var NUMBER = ['number', 'BigNumber', 'Fraction'];   // valid values for option number

  /**
   * Set configuration options for math.js, and get current options.
   * Will emit a 'config' event, with arguments (curr, prev, changes).
   *
   * Syntax:
   *
   *     math.config(config: Object): Object
   *
   * Examples:
   *
   *     math.config().number;                // outputs 'number'
   *     math.eval('0.4');                    // outputs number 0.4
   *     math.config({number: 'Fraction'});
   *     math.eval('0.4');                    // outputs Fraction 2/5
   *
   * @param {Object} [options] Available options:
   *                            {number} epsilon
   *                              Minimum relative difference between two
   *                              compared values, used by all comparison functions.
   *                            {string} matrix
   *                              A string 'Matrix' (default) or 'Array'.
   *                            {string} number
   *                              A string 'number' (default), 'BigNumber', or 'Fraction'
   *                            {number} precision
   *                              The number of significant digits for BigNumbers.
   *                              Not applicable for Numbers.
   *                            {string} parenthesis
   *                              How to display parentheses in LaTeX and string
   *                              output.
   *                            {string} randomSeed
   *                              Random seed for seeded pseudo random number generator.
   *                              Set to null to randomly seed.
   * @return {Object} Returns the current configuration
   */
  function _config(options) {
    if (options) {
      var prev = object.map(config, object.clone);

      // validate some of the options
      validateOption(options, 'matrix', MATRIX);
      validateOption(options, 'number', NUMBER);

      // merge options
      object.deepExtend(config, options);

      var curr = object.map(config, object.clone);

      var changes = object.map(options, object.clone);

      // emit 'config' event
      math.emit('config', curr, prev, changes);

      return curr;
    }
    else {
      return object.map(config, object.clone);
    }
  }

  // attach the valid options to the function so they can be extended
  _config.MATRIX = MATRIX;
  _config.NUMBER = NUMBER;

  return _config;
}

/**
 * Test whether an Array contains a specific item.
 * @param {Array.<string>} array
 * @param {string} item
 * @return {boolean}
 */
function contains (array, item) {
  return array.indexOf(item) !== -1;
}

/**
 * Find a string in an array. Case insensitive search
 * @param {Array.<string>} array
 * @param {string} item
 * @return {number} Returns the index when found. Returns -1 when not found
 */
function findIndex (array, item) {
  return array
      .map(function (i) {
        return i.toLowerCase();
      })
      .indexOf(item.toLowerCase());
}

/**
 * Validate an option
 * @param {Object} options         Object with options
 * @param {string} name            Name of the option to validate
 * @param {Array.<string>} values  Array with valid values for this option
 */
function validateOption(options, name, values) {
  if (options[name] !== undefined && !contains(values, options[name])) {
    var index = findIndex(values, options[name]);
    if (index !== -1) {
      // right value, wrong casing
      // TODO: lower case values are deprecated since v3, remove this warning some day.
      console.warn('Warning: Wrong casing for configuration option "' + name + '", should be "' + values[index] + '" instead of "' + options[name] + '".');

      options[name] = values[index]; // change the option to the right casing
    }
    else {
      // unknown value
      console.warn('Warning: Unknown value "' + options[name] + '" for configuration option "' + name + '". Available options: ' + values.map(JSON.stringify).join(', ') + '.');
    }
  }
}

var name$1 = 'config';
var math$2 = true; // request the math namespace as fifth argument
var factory_1$1 = factory$1;

var config = {
	name: name$1,
	math: math$2,
	factory: factory_1$1
};

var isFactory = object.isFactory;






/**
 * Math.js core. Creates a new, empty math.js instance
 * @param {Object} [options] Available options:
 *                            {number} epsilon
 *                              Minimum relative difference between two
 *                              compared values, used by all comparison functions.
 *                            {string} matrix
 *                              A string 'Matrix' (default) or 'Array'.
 *                            {string} number
 *                              A string 'number' (default), 'BigNumber', or 'Fraction'
 *                            {number} precision
 *                              The number of significant digits for BigNumbers.
 *                              Not applicable for Numbers.
 *                            {boolean} predictable
 *                              Predictable output type of functions. When true,
 *                              output type depends only on the input types. When
 *                              false (default), output type can vary depending
 *                              on input values. For example `math.sqrt(-4)`
 *                              returns `complex('2i')` when predictable is false, and
 *                              returns `NaN` when true.
 *                            {string} randomSeed
 *                              Random seed for seeded pseudo random number generator.
 *                              Set to null to randomly seed.
 * @returns {Object} Returns a bare-bone math.js instance containing
 *                   functions:
 *                   - `import` to add new functions
 *                   - `config` to change configuration
 *                   - `on`, `off`, `once`, `emit` for events
 */
var create$1 = function create (options) {
  // simple test for ES5 support
  if (typeof Object.create !== 'function') {
    throw new Error('ES5 not supported by this JavaScript engine. ' +
    'Please load the es5-shim and es5-sham library for compatibility.');
  }

  // cached factories and instances
  var factories = [];
  var instances = [];

  // create a namespace for the mathjs instance, and attach emitter functions
  var math = emitter.mixin({});
  math.type = {};
  math.expression = {
    transform: {},
    mathWithTransform: {}
  };

  // create a new typed instance
  math.typed = typed.create(math.type);

  // create configuration options. These are private
  var _config = {
    // minimum relative difference between two compared values,
    // used by all comparison functions
    epsilon: 1e-12,

    // type of default matrix output. Choose 'matrix' (default) or 'array'
    matrix: 'Matrix',

    // type of default number output. Choose 'number' (default) 'BigNumber', or 'Fraction
    number: 'number',

    // number of significant digits in BigNumbers
    precision: 64,

    // predictable output type of functions. When true, output type depends only
    // on the input types. When false (default), output type can vary depending
    // on input values. For example `math.sqrt(-4)` returns `complex('2i')` when
    // predictable is false, and returns `NaN` when true.
    predictable: false,

    // random seed for seeded pseudo random number generation
    // null = randomly seed
    randomSeed: null
  };

  /**
   * Load a function or data type from a factory.
   * If the function or data type already exists, the existing instance is
   * returned.
   * @param {{type: string, name: string, factory: Function}} factory
   * @returns {*}
   */
  function load (factory) {
    if (!isFactory(factory)) {
      throw new Error('Factory object with properties `type`, `name`, and `factory` expected');
    }

    var index = factories.indexOf(factory);
    var instance;
    if (index === -1) {
      // doesn't yet exist
      if (factory.math === true) {
        // pass with math namespace
        instance = factory.factory(math.type, _config, load, math.typed, math);
      }
      else {
        instance = factory.factory(math.type, _config, load, math.typed);
      }

      // append to the cache
      factories.push(factory);
      instances.push(instance);
    }
    else {
      // already existing function, return the cached instance
      instance = instances[index];
    }

    return instance;
  }

  // load the import and config functions
  math['import'] = load(_import);
  math['config'] = load(config);
  math.expression.mathWithTransform['config'] = math['config'];

  // apply options
  if (options) {
    math.config(options);
  }

  return math;
};

var core$2 = {
	create: create$1
};

var core$1 = core$2;

var M;
var T;
var __planeAngle;
var apparentDipCorrection;
var getRatios;
var matrix;
var scaleRatio;
var transpose$1;
var uuid;
var vecAngle;
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// We don't bundle mathjs right now but can if we figure out how
if (window.math != null) {
  // This is a pretty bad hack
  M = window.math;
  uuid = uuidShim;
} else {
  M = core$1();
  uuid = uuidNode;
}

exports.fixAngle = function(a) {
  // Put an angle on the interval [-Pi,Pi]
  while (a > Math.PI) {
    a -= 2 * Math.PI;
  }
  while (a < -Math.PI) {
    a += 2 * Math.PI;
  }
  return a;
};

//# Matrix to map down to 2 dimensions
T = M.matrix([[1, 0], [0, 0], [0, 1]]);

matrix = function(obj) {
  if (obj instanceof Q) {
    //# We're dealing with a quaternion,
    // need to convert to rotation matrix
    obj = obj.toMatrix(true);
  }
  return M.matrix(obj);
};

exports.dot = function(...args) {
  // Multiply matrices, ensuring matrix form
  return M.multiply(...args.map(matrix));
};

transpose$1 = function(m) {
  return M.transpose(matrix(m));
};

vecAngle = function(a0, a1) {
  var a0_, a1_;
  a0_ = M.divide(a0, M.norm(a0));
  a1_ = M.divide(a1, M.norm(a1));
  return exports.dot(a0_, a1_);
};

exports.fixAngle = function(a) {
  // Put an angle on the interval [-Pi,Pi]
  while (a > Math.PI) {
    a -= 2 * Math.PI;
  }
  while (a < -Math.PI) {
    a += 2 * Math.PI;
  }
  return a;
};

apparentDipCorrection = function(screenRatio = 1) {
  return function(axes2d) {
    var a0, a1, angle, cosA;
    // Correct for apparent dip
    a0 = axes2d[1];
    a1 = [0, 1];
    //a0 = M.divide(a0,M.norm(a0))
    //a1 = M.divide(a1,M.norm(a1))
    cosA = exports.dot(a0, a1);
    console.log("Axes", a0, cosA);
    angle = Math.atan2(Math.tan(Math.acos(cosA / (M.norm(a0) * M.norm(a1)))), screenRatio);
    return angle * 180 / Math.PI;
  };
};

scaleRatio = function(scale) {
  return scale(1) - scale(0);
};

getRatios = function(x, y) {
  var lineGenerator, ratioX, ratioY, screenRatio;
  // Ratios for x and y axes
  ratioX = scaleRatio(x);
  ratioY = scaleRatio(y);
  screenRatio = ratioX / ratioY;
  lineGenerator = d3$1.line().x(function(d) {
    return d[0] * ratioX;
  }).y(function(d) {
    return d[1] * ratioY;
  });
  return {ratioX, ratioY, screenRatio, lineGenerator};
};

__planeAngle = function(axes, angle) {
  var a0;
  // Get angle of the plane from the major axes
  a0 = axes.toArray()[0];
  return angle - M.acos(vecAngle([a0[0], a0[1], 0], [1, 0, 0]));
};

exports.hyperbolicErrors = function(viewpoint, axes, xScale, yScale) {
  var angle, centerPoint, dfunc, gradient, lineGenerator, n, nCoords, nominal, ratioX, ratioY, screenRatio, width;
  n = 10;
  angle = viewpoint;
  gradient = null;
  width = 400;
  nominal = false;
  centerPoint = false;
  // For 3 coordinates on each half of the hyperbola, we collapse down to
  // a special case where no trigonometry outside of tangents have to be calculated
  // at each step. This is much more efficient, at the cost of the fine structure
  // of the hyperbola near the origin
  nCoords = 3;
  ({ratioX, ratioY, screenRatio, lineGenerator} = getRatios(xScale, yScale));
  dfunc = function(d) {
    /* Project axes to 2d */
    var R, a, a1, angles, angularError, arr, ax, b, center, coords, cutAngle, cutAngle2, hyp, inPlaneLength, j, largeNumber, lengthShown, lim, limit, mask, masksz, mid, oa, offs, poly, q, rax, results, s, top, v;
    // Get a single level of planar errors (or the
    // plane's nominal value) as a girdle
    rax = d.axes;
    if (rax[2][2] < 0) {
      rax = rax.map(function(row) {
        return row.map(function(i) {
          return -i;
        });
      });
    }
    q = Q.fromAxisAngle([0, 0, 1], angle + Math.PI);
    R = matrix(axes);
    ax = exports.dot(M.transpose(R), d.axes, R);
    a1 = __planeAngle(ax, angle);
    //# Matrix to map down to 2 dimensions
    T = M.matrix([[1, 0], [0, 0], [0, 1]]);
    s = M.sqrt(d.lengths).map(function(d) {
      return 1 / d;
    });
    v = [s[0] * Math.cos(a1), s[1] * Math.sin(a1), s[2]];
    a = 1 / M.norm([v[0], v[1]]);
    b = 1 / M.abs(v[2]);
    //a = M.norm([e[0],e[1]])
    //b = e[2]

    // Major axes of the conic sliced in the requested viewing
    // geometry
    // Semiaxes of hyperbola
    cutAngle = Math.atan2(b, a);
    angularError = cutAngle * 2 * 180 / Math.PI;
    if (angularError > 90) {
      //# This plane has undefined errors
      hyp = d3$1.select(this).attr('visibility', 'hidden');
      return;
    }
    //console.log "Error: ", angularError
    // find length at which tangent is x long
    lengthShown = width / 2;
    cutAngle2 = Math.atan2(b, a * screenRatio);
    inPlaneLength = lengthShown * Math.cos(cutAngle2);
    //# We will transform with svg functions
    //# so we can neglect some of the math
    // for hyperbolae not aligned with the
    // coordinate plane.
    if (nCoords > 3) {
      angles = (function() {
        results = [];
        for (var j = 0; 0 <= n ? j < n : j > n; 0 <= n ? j++ : j--){ results.push(j); }
        return results;
      }).apply(this).map(function(d) {
        return cutAngle + (d / n * (Math.PI - cutAngle)) + Math.PI / 2;
      });
      arr = transpose$1([
        M.multiply(M.tan(angles),
        a),
        M.cos(angles).map(function(v) {
          return b / v;
        })
      ]);
    } else {
      arr = [[0, b]];
    }
    largeNumber = width / ratioX;
    limit = b / a * largeNumber;
    coords = [[-largeNumber, limit], ...arr, [largeNumber, limit]];
    // Correction for angle and means go here
    // unless managed by SVG transforms
    top = coords.map(function([x, y]) {
      return [x, -y];
    });
    top.reverse();
    poly = coords.concat(top);
    // Translate
    offs = exports.dot(d.offset, R, q).toArray();
    center = [xScale(offs[0]) - xScale(0), yScale(offs[2]) - yScale(0)];
    // Used for positioning, but later
    d.__z = offs[1];
    oa = exports.opacityByCertainty(function() {
      return d.color;
    }).angularError(function() {
      return angularError;
    }).max(5);
    // Correct for apparent dip
    //apparent = apparentDipCorrection(screenRatio)

    // grouped transform
    v = d.apparentDip(-angle + Math.PI / 2);
    v = -Math.atan2(Math.tan(v), screenRatio) * 180 / Math.PI;
    //if aT[1][0]*aT[1][1] < 0
    //__angle *= -1
    //console.log 'Angle', __angle
    //__angle = 0
    //# Start DOM manipulation ###
    hyp = d3$1.select(this).attr('visibility', 'visible').attr('transform', `translate(${-center[0] + xScale(0)},${yScale(0) + center[1]}) rotate(${v})`);
    hyp.classed('in_group', d.in_group);
    lim = width / 2;
    lim = Math.abs(inPlaneLength);
    masksz = {
      x: -lim,
      y: -lim,
      width: lim * 2,
      height: lim * 2
    };
    mask = hyp.select('mask');
    mid = null;
    if (!mask.node()) {
      mid = uuid.v4();
      mask = hyp.append('mask').attr('id', mid).attrs(masksz).append('rect').attrs(_extends({}, masksz, {
        fill: "url(#gradient)"
      }));
    }
    if (mid == null) {
      mid = mask.attr('id');
    }
    if (centerPoint) {
      hyp.selectAppend('circle').attrs({
        r: 2,
        fill: 'black'
      });
    }
    return hyp.selectAppend('path.hyperbola').datum(poly).attr('d', function(v) {
      return lineGenerator(v) + "Z";
    }).each(oa).attr('mask', `url(#${mid})`);
  };
  //if nominal
  //hyp.selectAppend 'line.nominal'
  //.attrs x1: -largeNumber, x2: largeNumber
  //.attr 'stroke', '#000000'
  dfunc.setupGradient = function(el) {
    var defs, g, stop;
    defs = el.append('defs');
    g = defs.append('linearGradient').attr('id', 'gradient');
    stop = function(ofs, op) {
      var a;
      a = Math.round(op * 255);
      return g.append('stop').attrs({
        offset: ofs,
        'stop-color': `rgb(${a},${a},${a})`,
        'stop-opacity': op
      });
    };
    stop(0, 0);
    stop(0.2, 0.1);
    stop(0.45, 1);
    stop(0.55, 1);
    stop(0.8, 0.1);
    return stop(1, 0);
  };
  dfunc.width = function(o) {
    if (o == null) {
      return width;
    }
    width = o;
    return dfunc;
  };
  dfunc.nominal = function(o) {
    if (o == null) {
      return nominal;
    }
    nominal = o;
    return dfunc;
  };
  return dfunc;
};

exports.digitizedLine = function(viewpoint, lineGenerator) {
  var axes, f;
  axes = M.eye(3);
  f = function(d) {
    /* Map down to two dimensions (the x-z plane of the viewing geometry) */
    /* Create a line from input points */
    /* Put in axis-aligned coordinates */
    var R, a, alignedWithGroup, data, offs, q, v;
    q = Q.fromAxisAngle([0, 0, 1], viewpoint);
    R = M.transpose(matrix(axes));
    alignedWithGroup = exports.dot(d.centered, R);
    offs = exports.dot(d.offset, R);
    v = alignedWithGroup.toArray().map(function(row) {
      return M.add(row, offs);
    });
    a = exports.dot(v, q);
    data = exports.dot(a, T).toArray();
    return d3$1.select(this).attr('d', lineGenerator(data));
  };
  f.axes = function(o) {
    if (o == null) {
      return axes;
    }
    axes = o;
    return f;
  };
  return f;
};

exports.apparentDip = function(viewpoint, xScale, yScale) {
  var axes, f, lineGenerator, ratioX, ratioY, screenRatio;
  axes = M.eye(3);
  ({ratioX, ratioY, screenRatio, lineGenerator} = getRatios(xScale, yScale));
  //if not axes?
  f = function(d) {
    /* Map down to two dimensions (the x-z plane of the viewing geometry) */
    /* Create a line from input points */
    /* Put in axis-aligned coordinates */
    var A, R, a, data, n, n1, normal, offs, planeAxes, q, qA, qR, v;
    //d3.select @
    //.attr 'd',lineGenerator(lineData)
    //.attr 'transform', "translate(#{xScale(offs[0])},#{yScale(offs[2])})rotate(#{v})"
    planeAxes = d.axes;
    if (d.group != null) {
      planeAxes = d.group.axes;
    }
    q = Q.fromAxisAngle([0, 0, 1], viewpoint);
    R = M.transpose(matrix(axes));
    A = planeAxes;
    // Find fit normal in new coordinates
    normal = exports.dot(A[2], R, q);
    // Get transform that puts normal in xz plane
    n = normal.toArray();
    n[1] = Math.abs(n[1]);
    n1 = [n[0], 0, n[2]];
    n1 = n1.map(function(d) {
      return d / M.norm(n1);
    });
    qR = Q.fromBetweenVectors(n, n1);
    // Without adding this other quaternion, it is the same as just showing
    // digitized lines
    qA = q.mul(qR);
    v = exports.dot(d.centered, R);
    a = exports.dot(v, qA);
    data = exports.dot(a, T).toArray();
    // Get offset of angles
    offs = exports.dot(d.offset, R, q, T).toArray();
    return d3$1.select(this).attr('d', lineGenerator(data)).attr('transform', `translate(${xScale(offs[0])},${yScale(offs[1])})`);
  };
  f.axes = function(o) {
    if (o == null) {
      return axes;
    }
    axes = o;
    return f;
  };
  return f;
};

exports.PlaneData = class PlaneData {
  constructor(data, mean$$1 = null) {
    var axes, color, extracted, hyperbolic_axes;
    this.dip = this.dip.bind(this);
    this.apparentDip = this.apparentDip.bind(this);
    ({axes, hyperbolic_axes, extracted, color} = data);
    this.mean = mean$$1 || data.mean || data.center;
    this.axes = data.axes;
    this.color = color;
    this.lengths = hyperbolic_axes;
    this.in_group = data.in_group;
    this.array = extracted;
    this.data = data;
    this.centered = data.centered_array;
    // If we didn't pass a mean, we have to compute one
    if (this.array == null) {
      return;
    }
    //# Extract mean of data on each axis ##
    if (this.mean == null) {
      this.mean = [0, 1, 2].map((i) => {
        return d3$1.mean(this.array, function(d) {
          return d[i];
        });
      });
    }
    if (this.centered == null) {
      this.centered = this.array.map((d) => {
        return M.subtract(d, this.mean);
      });
    }
  }

  dip() {
    var dip, dipDr, n, r;
    n = this.axes[2];
    r = M.norm(n);
    dip = M.acos(n[2] / r);
    dipDr = exports.fixAngle(Math.atan2(n[0], n[1]));
    return [dip, dipDr];
  }

  apparentDip(azimuth) {
    var a, d, dip, dipDr, n, r, sign;
    n = this.axes[2];
    r = M.norm(n);
    [dip, dipDr] = this.dip();
    dipDr = Math.atan2(n[0], n[1]);
    a = exports.fixAngle(azimuth - dipDr);
    sign = -Math.PI / 2 < a || Math.PI / 2 > a ? 1 : -1;
    d = M.tan(dip) * M.cos(azimuth - dipDr);
    return sign * Math.atan(d);
  }

};

// Entrypoint for importing components
// from node.js

exports.functions = functions;
exports.math = math;
exports.chroma = chroma;
