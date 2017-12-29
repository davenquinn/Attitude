(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3')) :
	typeof define === 'function' && define.amd ? define(['exports', 'd3'], factory) :
	(factory((global.attitude = global.attitude || {}),global.d3));
}(this, (function (exports,d3$1) { 'use strict';

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

createErrorSurface = function(d) {
  var a, e, f;
  // Function that turns orientation
  // objects into error surface
  e = [d.lower, d.upper.reverse()];
  f = createFeature("Polygon", e);
  a = d3$1.geoArea(f);
  if (a > 2 * Math.PI) {
    f = createFeature("Polygon", e.map(function(d) {
      return d.reverse();
    }));
  }
  if (f.properties == null) {
    f.properties = {};
  }
  f.properties.area = a;
  return f;
};

createNominalPlane = function(d) {
  return createFeature('LineString', d.nominal);
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
    el.append("path").datum(createErrorSurface(e)).attr('class', 'error');
    if (!opts.nominal) {
      return;
    }
    // Create nominal plane
    return el.append("path").datum(createNominalPlane(e)).attr('class', 'nominal');
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

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var chroma = createCommonjsModule(function (module, exports) {
/**
 * @license
 *
 * chroma.js - JavaScript library for color conversions
 * 
 * Copyright (c) 2011-2017, Gregor Aisch
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 * 
 * 3. The name Gregor Aisch may not be used to endorse or promote products
 *    derived from this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
 * EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 */

(function() {
  var Color, DEG2RAD, LAB_CONSTANTS, PI, PITHIRD, RAD2DEG, TWOPI, _average_lrgb, _guess_formats, _guess_formats_sorted, _input, _interpolators, abs, atan2, bezier, blend, blend_f, brewer, burn, chroma, clip_rgb, cmyk2rgb, colors, cos, css2rgb, darken, dodge, each, floor, hcg2rgb, hex2rgb, hsi2rgb, hsl2css, hsl2rgb, hsv2rgb, interpolate, interpolate_hsx, interpolate_lab, interpolate_lrgb, interpolate_num, interpolate_rgb, lab2lch, lab2rgb, lab_xyz, lch2lab, lch2rgb, lighten, limit, log, luminance_x, m, max, multiply, normal, num2rgb, overlay, pow, rgb2cmyk, rgb2css, rgb2hcg, rgb2hex, rgb2hsi, rgb2hsl, rgb2hsv, rgb2lab, rgb2lch, rgb2luminance, rgb2num, rgb2temperature, rgb2xyz, rgb_xyz, rnd, root, round, screen, sin, sqrt, temperature2rgb, type, unpack, w3cx11, xyz_lab, xyz_rgb,
    slice = [].slice;

  type = (function() {

    /*
    for browser-safe type checking+
    ported from jQuery's $.type
     */
    var classToType, len, name, o, ref;
    classToType = {};
    ref = "Boolean Number String Function Array Date RegExp Undefined Null".split(" ");
    for (o = 0, len = ref.length; o < len; o++) {
      name = ref[o];
      classToType["[object " + name + "]"] = name.toLowerCase();
    }
    return function(obj) {
      var strType;
      strType = Object.prototype.toString.call(obj);
      return classToType[strType] || "object";
    };
  })();

  limit = function(x, min, max) {
    if (min == null) {
      min = 0;
    }
    if (max == null) {
      max = 1;
    }
    if (x < min) {
      x = min;
    }
    if (x > max) {
      x = max;
    }
    return x;
  };

  unpack = function(args) {
    if (args.length >= 3) {
      return [].slice.call(args);
    } else {
      return args[0];
    }
  };

  clip_rgb = function(rgb) {
    var i, o;
    rgb._clipped = false;
    rgb._unclipped = rgb.slice(0);
    for (i = o = 0; o < 3; i = ++o) {
      if (i < 3) {
        if (rgb[i] < 0 || rgb[i] > 255) {
          rgb._clipped = true;
        }
        if (rgb[i] < 0) {
          rgb[i] = 0;
        }
        if (rgb[i] > 255) {
          rgb[i] = 255;
        }
      } else if (i === 3) {
        if (rgb[i] < 0) {
          rgb[i] = 0;
        }
        if (rgb[i] > 1) {
          rgb[i] = 1;
        }
      }
    }
    if (!rgb._clipped) {
      delete rgb._unclipped;
    }
    return rgb;
  };

  PI = Math.PI, round = Math.round, cos = Math.cos, floor = Math.floor, pow = Math.pow, log = Math.log, sin = Math.sin, sqrt = Math.sqrt, atan2 = Math.atan2, max = Math.max, abs = Math.abs;

  TWOPI = PI * 2;

  PITHIRD = PI / 3;

  DEG2RAD = PI / 180;

  RAD2DEG = 180 / PI;

  chroma = function() {
    if (arguments[0] instanceof Color) {
      return arguments[0];
    }
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, arguments, function(){});
  };

  chroma["default"] = chroma;

  _interpolators = [];

  if (('object' !== "undefined" && module !== null) && (module.exports != null)) {
    module.exports = chroma;
  }

  if (typeof undefined === 'function' && undefined.amd) {
    undefined([], function() {
      return chroma;
    });
  } else {
    root = 'object' !== "undefined" && exports !== null ? exports : this;
    root.chroma = chroma;
  }

  chroma.version = '1.3.4';

  _input = {};

  _guess_formats = [];

  _guess_formats_sorted = false;

  Color = (function() {
    function Color() {
      var arg, args, chk, len, len1, me, mode, o, w;
      me = this;
      args = [];
      for (o = 0, len = arguments.length; o < len; o++) {
        arg = arguments[o];
        if (arg != null) {
          args.push(arg);
        }
      }
      if (args.length > 1) {
        mode = args[args.length - 1];
      }
      if (_input[mode] != null) {
        me._rgb = clip_rgb(_input[mode](unpack(args.slice(0, -1))));
      } else {
        if (!_guess_formats_sorted) {
          _guess_formats = _guess_formats.sort(function(a, b) {
            return b.p - a.p;
          });
          _guess_formats_sorted = true;
        }
        for (w = 0, len1 = _guess_formats.length; w < len1; w++) {
          chk = _guess_formats[w];
          mode = chk.test.apply(chk, args);
          if (mode) {
            break;
          }
        }
        if (mode) {
          me._rgb = clip_rgb(_input[mode].apply(_input, args));
        }
      }
      if (me._rgb == null) {
        console.warn('unknown format: ' + args);
      }
      if (me._rgb == null) {
        me._rgb = [0, 0, 0];
      }
      if (me._rgb.length === 3) {
        me._rgb.push(1);
      }
    }

    Color.prototype.toString = function() {
      return this.hex();
    };

    Color.prototype.clone = function() {
      return chroma(me._rgb);
    };

    return Color;

  })();

  chroma._input = _input;


  /**
  	ColorBrewer colors for chroma.js
  
  	Copyright (c) 2002 Cynthia Brewer, Mark Harrower, and The 
  	Pennsylvania State University.
  
  	Licensed under the Apache License, Version 2.0 (the "License"); 
  	you may not use this file except in compliance with the License.
  	You may obtain a copy of the License at	
  	http://www.apache.org/licenses/LICENSE-2.0
  
  	Unless required by applicable law or agreed to in writing, software distributed
  	under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
  	CONDITIONS OF ANY KIND, either express or implied. See the License for the
  	specific language governing permissions and limitations under the License.
  
      @preserve
   */

  chroma.brewer = brewer = {
    OrRd: ['#fff7ec', '#fee8c8', '#fdd49e', '#fdbb84', '#fc8d59', '#ef6548', '#d7301f', '#b30000', '#7f0000'],
    PuBu: ['#fff7fb', '#ece7f2', '#d0d1e6', '#a6bddb', '#74a9cf', '#3690c0', '#0570b0', '#045a8d', '#023858'],
    BuPu: ['#f7fcfd', '#e0ecf4', '#bfd3e6', '#9ebcda', '#8c96c6', '#8c6bb1', '#88419d', '#810f7c', '#4d004b'],
    Oranges: ['#fff5eb', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
    BuGn: ['#f7fcfd', '#e5f5f9', '#ccece6', '#99d8c9', '#66c2a4', '#41ae76', '#238b45', '#006d2c', '#00441b'],
    YlOrBr: ['#ffffe5', '#fff7bc', '#fee391', '#fec44f', '#fe9929', '#ec7014', '#cc4c02', '#993404', '#662506'],
    YlGn: ['#ffffe5', '#f7fcb9', '#d9f0a3', '#addd8e', '#78c679', '#41ab5d', '#238443', '#006837', '#004529'],
    Reds: ['#fff5f0', '#fee0d2', '#fcbba1', '#fc9272', '#fb6a4a', '#ef3b2c', '#cb181d', '#a50f15', '#67000d'],
    RdPu: ['#fff7f3', '#fde0dd', '#fcc5c0', '#fa9fb5', '#f768a1', '#dd3497', '#ae017e', '#7a0177', '#49006a'],
    Greens: ['#f7fcf5', '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', '#006d2c', '#00441b'],
    YlGnBu: ['#ffffd9', '#edf8b1', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#253494', '#081d58'],
    Purples: ['#fcfbfd', '#efedf5', '#dadaeb', '#bcbddc', '#9e9ac8', '#807dba', '#6a51a3', '#54278f', '#3f007d'],
    GnBu: ['#f7fcf0', '#e0f3db', '#ccebc5', '#a8ddb5', '#7bccc4', '#4eb3d3', '#2b8cbe', '#0868ac', '#084081'],
    Greys: ['#ffffff', '#f0f0f0', '#d9d9d9', '#bdbdbd', '#969696', '#737373', '#525252', '#252525', '#000000'],
    YlOrRd: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026'],
    PuRd: ['#f7f4f9', '#e7e1ef', '#d4b9da', '#c994c7', '#df65b0', '#e7298a', '#ce1256', '#980043', '#67001f'],
    Blues: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1', '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'],
    PuBuGn: ['#fff7fb', '#ece2f0', '#d0d1e6', '#a6bddb', '#67a9cf', '#3690c0', '#02818a', '#016c59', '#014636'],
    Viridis: ['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],
    Spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
    RdYlGn: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#d9ef8b', '#a6d96a', '#66bd63', '#1a9850', '#006837'],
    RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
    PiYG: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
    PRGn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
    RdYlBu: ['#a50026', '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf', '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'],
    BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
    RdGy: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#ffffff', '#e0e0e0', '#bababa', '#878787', '#4d4d4d', '#1a1a1a'],
    PuOr: ['#7f3b08', '#b35806', '#e08214', '#fdb863', '#fee0b6', '#f7f7f7', '#d8daeb', '#b2abd2', '#8073ac', '#542788', '#2d004b'],
    Set2: ['#66c2a5', '#fc8d62', '#8da0cb', '#e78ac3', '#a6d854', '#ffd92f', '#e5c494', '#b3b3b3'],
    Accent: ['#7fc97f', '#beaed4', '#fdc086', '#ffff99', '#386cb0', '#f0027f', '#bf5b17', '#666666'],
    Set1: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00', '#ffff33', '#a65628', '#f781bf', '#999999'],
    Set3: ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'],
    Dark2: ['#1b9e77', '#d95f02', '#7570b3', '#e7298a', '#66a61e', '#e6ab02', '#a6761d', '#666666'],
    Paired: ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'],
    Pastel2: ['#b3e2cd', '#fdcdac', '#cbd5e8', '#f4cae4', '#e6f5c9', '#fff2ae', '#f1e2cc', '#cccccc'],
    Pastel1: ['#fbb4ae', '#b3cde3', '#ccebc5', '#decbe4', '#fed9a6', '#ffffcc', '#e5d8bd', '#fddaec', '#f2f2f2']
  };

  (function() {
    var key, results;
    results = [];
    for (key in brewer) {
      results.push(brewer[key.toLowerCase()] = brewer[key]);
    }
    return results;
  })();


  /**
  	X11 color names
  
  	http://www.w3.org/TR/css3-color/#svg-color
   */

  w3cx11 = {
    aliceblue: '#f0f8ff',
    antiquewhite: '#faebd7',
    aqua: '#00ffff',
    aquamarine: '#7fffd4',
    azure: '#f0ffff',
    beige: '#f5f5dc',
    bisque: '#ffe4c4',
    black: '#000000',
    blanchedalmond: '#ffebcd',
    blue: '#0000ff',
    blueviolet: '#8a2be2',
    brown: '#a52a2a',
    burlywood: '#deb887',
    cadetblue: '#5f9ea0',
    chartreuse: '#7fff00',
    chocolate: '#d2691e',
    coral: '#ff7f50',
    cornflower: '#6495ed',
    cornflowerblue: '#6495ed',
    cornsilk: '#fff8dc',
    crimson: '#dc143c',
    cyan: '#00ffff',
    darkblue: '#00008b',
    darkcyan: '#008b8b',
    darkgoldenrod: '#b8860b',
    darkgray: '#a9a9a9',
    darkgreen: '#006400',
    darkgrey: '#a9a9a9',
    darkkhaki: '#bdb76b',
    darkmagenta: '#8b008b',
    darkolivegreen: '#556b2f',
    darkorange: '#ff8c00',
    darkorchid: '#9932cc',
    darkred: '#8b0000',
    darksalmon: '#e9967a',
    darkseagreen: '#8fbc8f',
    darkslateblue: '#483d8b',
    darkslategray: '#2f4f4f',
    darkslategrey: '#2f4f4f',
    darkturquoise: '#00ced1',
    darkviolet: '#9400d3',
    deeppink: '#ff1493',
    deepskyblue: '#00bfff',
    dimgray: '#696969',
    dimgrey: '#696969',
    dodgerblue: '#1e90ff',
    firebrick: '#b22222',
    floralwhite: '#fffaf0',
    forestgreen: '#228b22',
    fuchsia: '#ff00ff',
    gainsboro: '#dcdcdc',
    ghostwhite: '#f8f8ff',
    gold: '#ffd700',
    goldenrod: '#daa520',
    gray: '#808080',
    green: '#008000',
    greenyellow: '#adff2f',
    grey: '#808080',
    honeydew: '#f0fff0',
    hotpink: '#ff69b4',
    indianred: '#cd5c5c',
    indigo: '#4b0082',
    ivory: '#fffff0',
    khaki: '#f0e68c',
    laserlemon: '#ffff54',
    lavender: '#e6e6fa',
    lavenderblush: '#fff0f5',
    lawngreen: '#7cfc00',
    lemonchiffon: '#fffacd',
    lightblue: '#add8e6',
    lightcoral: '#f08080',
    lightcyan: '#e0ffff',
    lightgoldenrod: '#fafad2',
    lightgoldenrodyellow: '#fafad2',
    lightgray: '#d3d3d3',
    lightgreen: '#90ee90',
    lightgrey: '#d3d3d3',
    lightpink: '#ffb6c1',
    lightsalmon: '#ffa07a',
    lightseagreen: '#20b2aa',
    lightskyblue: '#87cefa',
    lightslategray: '#778899',
    lightslategrey: '#778899',
    lightsteelblue: '#b0c4de',
    lightyellow: '#ffffe0',
    lime: '#00ff00',
    limegreen: '#32cd32',
    linen: '#faf0e6',
    magenta: '#ff00ff',
    maroon: '#800000',
    maroon2: '#7f0000',
    maroon3: '#b03060',
    mediumaquamarine: '#66cdaa',
    mediumblue: '#0000cd',
    mediumorchid: '#ba55d3',
    mediumpurple: '#9370db',
    mediumseagreen: '#3cb371',
    mediumslateblue: '#7b68ee',
    mediumspringgreen: '#00fa9a',
    mediumturquoise: '#48d1cc',
    mediumvioletred: '#c71585',
    midnightblue: '#191970',
    mintcream: '#f5fffa',
    mistyrose: '#ffe4e1',
    moccasin: '#ffe4b5',
    navajowhite: '#ffdead',
    navy: '#000080',
    oldlace: '#fdf5e6',
    olive: '#808000',
    olivedrab: '#6b8e23',
    orange: '#ffa500',
    orangered: '#ff4500',
    orchid: '#da70d6',
    palegoldenrod: '#eee8aa',
    palegreen: '#98fb98',
    paleturquoise: '#afeeee',
    palevioletred: '#db7093',
    papayawhip: '#ffefd5',
    peachpuff: '#ffdab9',
    peru: '#cd853f',
    pink: '#ffc0cb',
    plum: '#dda0dd',
    powderblue: '#b0e0e6',
    purple: '#800080',
    purple2: '#7f007f',
    purple3: '#a020f0',
    rebeccapurple: '#663399',
    red: '#ff0000',
    rosybrown: '#bc8f8f',
    royalblue: '#4169e1',
    saddlebrown: '#8b4513',
    salmon: '#fa8072',
    sandybrown: '#f4a460',
    seagreen: '#2e8b57',
    seashell: '#fff5ee',
    sienna: '#a0522d',
    silver: '#c0c0c0',
    skyblue: '#87ceeb',
    slateblue: '#6a5acd',
    slategray: '#708090',
    slategrey: '#708090',
    snow: '#fffafa',
    springgreen: '#00ff7f',
    steelblue: '#4682b4',
    tan: '#d2b48c',
    teal: '#008080',
    thistle: '#d8bfd8',
    tomato: '#ff6347',
    turquoise: '#40e0d0',
    violet: '#ee82ee',
    wheat: '#f5deb3',
    white: '#ffffff',
    whitesmoke: '#f5f5f5',
    yellow: '#ffff00',
    yellowgreen: '#9acd32'
  };

  chroma.colors = colors = w3cx11;

  lab2rgb = function() {
    var a, args, b, g, l, r, x, y, z;
    args = unpack(arguments);
    l = args[0], a = args[1], b = args[2];
    y = (l + 16) / 116;
    x = isNaN(a) ? y : y + a / 500;
    z = isNaN(b) ? y : y - b / 200;
    y = LAB_CONSTANTS.Yn * lab_xyz(y);
    x = LAB_CONSTANTS.Xn * lab_xyz(x);
    z = LAB_CONSTANTS.Zn * lab_xyz(z);
    r = xyz_rgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z);
    g = xyz_rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z);
    b = xyz_rgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);
    return [r, g, b, args.length > 3 ? args[3] : 1];
  };

  xyz_rgb = function(r) {
    return 255 * (r <= 0.00304 ? 12.92 * r : 1.055 * pow(r, 1 / 2.4) - 0.055);
  };

  lab_xyz = function(t) {
    if (t > LAB_CONSTANTS.t1) {
      return t * t * t;
    } else {
      return LAB_CONSTANTS.t2 * (t - LAB_CONSTANTS.t0);
    }
  };

  LAB_CONSTANTS = {
    Kn: 18,
    Xn: 0.950470,
    Yn: 1,
    Zn: 1.088830,
    t0: 0.137931034,
    t1: 0.206896552,
    t2: 0.12841855,
    t3: 0.008856452
  };

  rgb2lab = function() {
    var b, g, r, ref, ref1, x, y, z;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    ref1 = rgb2xyz(r, g, b), x = ref1[0], y = ref1[1], z = ref1[2];
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };

  rgb_xyz = function(r) {
    if ((r /= 255) <= 0.04045) {
      return r / 12.92;
    } else {
      return pow((r + 0.055) / 1.055, 2.4);
    }
  };

  xyz_lab = function(t) {
    if (t > LAB_CONSTANTS.t3) {
      return pow(t, 1 / 3);
    } else {
      return t / LAB_CONSTANTS.t2 + LAB_CONSTANTS.t0;
    }
  };

  rgb2xyz = function() {
    var b, g, r, ref, x, y, z;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    r = rgb_xyz(r);
    g = rgb_xyz(g);
    b = rgb_xyz(b);
    x = xyz_lab((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / LAB_CONSTANTS.Xn);
    y = xyz_lab((0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / LAB_CONSTANTS.Yn);
    z = xyz_lab((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / LAB_CONSTANTS.Zn);
    return [x, y, z];
  };

  chroma.lab = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['lab']), function(){});
  };

  _input.lab = lab2rgb;

  Color.prototype.lab = function() {
    return rgb2lab(this._rgb);
  };

  bezier = function(colors) {
    var I, I0, I1, c, lab0, lab1, lab2, lab3, ref, ref1, ref2;
    colors = (function() {
      var len, o, results;
      results = [];
      for (o = 0, len = colors.length; o < len; o++) {
        c = colors[o];
        results.push(chroma(c));
      }
      return results;
    })();
    if (colors.length === 2) {
      ref = (function() {
        var len, o, results;
        results = [];
        for (o = 0, len = colors.length; o < len; o++) {
          c = colors[o];
          results.push(c.lab());
        }
        return results;
      })(), lab0 = ref[0], lab1 = ref[1];
      I = function(t) {
        var i, lab;
        lab = (function() {
          var o, results;
          results = [];
          for (i = o = 0; o <= 2; i = ++o) {
            results.push(lab0[i] + t * (lab1[i] - lab0[i]));
          }
          return results;
        })();
        return chroma.lab.apply(chroma, lab);
      };
    } else if (colors.length === 3) {
      ref1 = (function() {
        var len, o, results;
        results = [];
        for (o = 0, len = colors.length; o < len; o++) {
          c = colors[o];
          results.push(c.lab());
        }
        return results;
      })(), lab0 = ref1[0], lab1 = ref1[1], lab2 = ref1[2];
      I = function(t) {
        var i, lab;
        lab = (function() {
          var o, results;
          results = [];
          for (i = o = 0; o <= 2; i = ++o) {
            results.push((1 - t) * (1 - t) * lab0[i] + 2 * (1 - t) * t * lab1[i] + t * t * lab2[i]);
          }
          return results;
        })();
        return chroma.lab.apply(chroma, lab);
      };
    } else if (colors.length === 4) {
      ref2 = (function() {
        var len, o, results;
        results = [];
        for (o = 0, len = colors.length; o < len; o++) {
          c = colors[o];
          results.push(c.lab());
        }
        return results;
      })(), lab0 = ref2[0], lab1 = ref2[1], lab2 = ref2[2], lab3 = ref2[3];
      I = function(t) {
        var i, lab;
        lab = (function() {
          var o, results;
          results = [];
          for (i = o = 0; o <= 2; i = ++o) {
            results.push((1 - t) * (1 - t) * (1 - t) * lab0[i] + 3 * (1 - t) * (1 - t) * t * lab1[i] + 3 * (1 - t) * t * t * lab2[i] + t * t * t * lab3[i]);
          }
          return results;
        })();
        return chroma.lab.apply(chroma, lab);
      };
    } else if (colors.length === 5) {
      I0 = bezier(colors.slice(0, 3));
      I1 = bezier(colors.slice(2, 5));
      I = function(t) {
        if (t < 0.5) {
          return I0(t * 2);
        } else {
          return I1((t - 0.5) * 2);
        }
      };
    }
    return I;
  };

  chroma.bezier = function(colors) {
    var f;
    f = bezier(colors);
    f.scale = function() {
      return chroma.scale(f);
    };
    return f;
  };


  /*
      chroma.js
  
      Copyright (c) 2011-2013, Gregor Aisch
      All rights reserved.
  
      Redistribution and use in source and binary forms, with or without
      modification, are permitted provided that the following conditions are met:
  
      * Redistributions of source code must retain the above copyright notice, this
        list of conditions and the following disclaimer.
  
      * Redistributions in binary form must reproduce the above copyright notice,
        this list of conditions and the following disclaimer in the documentation
        and/or other materials provided with the distribution.
  
      * The name Gregor Aisch may not be used to endorse or promote products
        derived from this software without specific prior written permission.
  
      THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
      AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
      IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
      DISCLAIMED. IN NO EVENT SHALL GREGOR AISCH OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT,
      INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
      BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
      DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
      OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
      NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE,
      EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  
      @source: https://github.com/gka/chroma.js
   */

  chroma.cubehelix = function(start, rotations, hue, gamma, lightness) {
    var dh, dl, f;
    if (start == null) {
      start = 300;
    }
    if (rotations == null) {
      rotations = -1.5;
    }
    if (hue == null) {
      hue = 1;
    }
    if (gamma == null) {
      gamma = 1;
    }
    if (lightness == null) {
      lightness = [0, 1];
    }
    dh = 0;
    if (type(lightness) === 'array') {
      dl = lightness[1] - lightness[0];
    } else {
      dl = 0;
      lightness = [lightness, lightness];
    }
    f = function(fract) {
      var a, amp, b, cos_a, g, h, l, r, sin_a;
      a = TWOPI * ((start + 120) / 360 + rotations * fract);
      l = pow(lightness[0] + dl * fract, gamma);
      h = dh !== 0 ? hue[0] + fract * dh : hue;
      amp = h * l * (1 - l) / 2;
      cos_a = cos(a);
      sin_a = sin(a);
      r = l + amp * (-0.14861 * cos_a + 1.78277 * sin_a);
      g = l + amp * (-0.29227 * cos_a - 0.90649 * sin_a);
      b = l + amp * (+1.97294 * cos_a);
      return chroma(clip_rgb([r * 255, g * 255, b * 255]));
    };
    f.start = function(s) {
      if (s == null) {
        return start;
      }
      start = s;
      return f;
    };
    f.rotations = function(r) {
      if (r == null) {
        return rotations;
      }
      rotations = r;
      return f;
    };
    f.gamma = function(g) {
      if (g == null) {
        return gamma;
      }
      gamma = g;
      return f;
    };
    f.hue = function(h) {
      if (h == null) {
        return hue;
      }
      hue = h;
      if (type(hue) === 'array') {
        dh = hue[1] - hue[0];
        if (dh === 0) {
          hue = hue[1];
        }
      } else {
        dh = 0;
      }
      return f;
    };
    f.lightness = function(h) {
      if (h == null) {
        return lightness;
      }
      if (type(h) === 'array') {
        lightness = h;
        dl = h[1] - h[0];
      } else {
        lightness = [h, h];
        dl = 0;
      }
      return f;
    };
    f.scale = function() {
      return chroma.scale(f);
    };
    f.hue(hue);
    return f;
  };

  chroma.random = function() {
    var code, digits, i, o;
    digits = '0123456789abcdef';
    code = '#';
    for (i = o = 0; o < 6; i = ++o) {
      code += digits.charAt(floor(Math.random() * 16));
    }
    return new Color(code);
  };

  _interpolators = [];

  interpolate = function(col1, col2, f, m) {
    var interpol, len, o, res;
    if (f == null) {
      f = 0.5;
    }
    if (m == null) {
      m = 'rgb';
    }

    /*
    interpolates between colors
    f = 0 --> me
    f = 1 --> col
     */
    if (type(col1) !== 'object') {
      col1 = chroma(col1);
    }
    if (type(col2) !== 'object') {
      col2 = chroma(col2);
    }
    for (o = 0, len = _interpolators.length; o < len; o++) {
      interpol = _interpolators[o];
      if (m === interpol[0]) {
        res = interpol[1](col1, col2, f, m);
        break;
      }
    }
    if (res == null) {
      throw "color mode " + m + " is not supported";
    }
    return res.alpha(col1.alpha() + f * (col2.alpha() - col1.alpha()));
  };

  chroma.interpolate = interpolate;

  Color.prototype.interpolate = function(col2, f, m) {
    return interpolate(this, col2, f, m);
  };

  chroma.mix = interpolate;

  Color.prototype.mix = Color.prototype.interpolate;

  _input.rgb = function() {
    var k, ref, results, v;
    ref = unpack(arguments);
    results = [];
    for (k in ref) {
      v = ref[k];
      results.push(v);
    }
    return results;
  };

  chroma.rgb = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['rgb']), function(){});
  };

  Color.prototype.rgb = function(round) {
    if (round == null) {
      round = true;
    }
    if (round) {
      return this._rgb.map(Math.round).slice(0, 3);
    } else {
      return this._rgb.slice(0, 3);
    }
  };

  Color.prototype.rgba = function(round) {
    if (round == null) {
      round = true;
    }
    if (!round) {
      return this._rgb.slice(0);
    }
    return [Math.round(this._rgb[0]), Math.round(this._rgb[1]), Math.round(this._rgb[2]), this._rgb[3]];
  };

  _guess_formats.push({
    p: 3,
    test: function(n) {
      var a;
      a = unpack(arguments);
      if (type(a) === 'array' && a.length === 3) {
        return 'rgb';
      }
      if (a.length === 4 && type(a[3]) === "number" && a[3] >= 0 && a[3] <= 1) {
        return 'rgb';
      }
    }
  });

  _input.lrgb = _input.rgb;

  interpolate_lrgb = function(col1, col2, f, m) {
    var xyz0, xyz1;
    xyz0 = col1._rgb;
    xyz1 = col2._rgb;
    return new Color(sqrt(pow(xyz0[0], 2) * (1 - f) + pow(xyz1[0], 2) * f), sqrt(pow(xyz0[1], 2) * (1 - f) + pow(xyz1[1], 2) * f), sqrt(pow(xyz0[2], 2) * (1 - f) + pow(xyz1[2], 2) * f), m);
  };

  _average_lrgb = function(colors) {
    var col, f, len, o, rgb, xyz;
    f = 1 / colors.length;
    xyz = [0, 0, 0, 0];
    for (o = 0, len = colors.length; o < len; o++) {
      col = colors[o];
      rgb = col._rgb;
      xyz[0] += pow(rgb[0], 2) * f;
      xyz[1] += pow(rgb[1], 2) * f;
      xyz[2] += pow(rgb[2], 2) * f;
      xyz[3] += rgb[3] * f;
    }
    xyz[0] = sqrt(xyz[0]);
    xyz[1] = sqrt(xyz[1]);
    xyz[2] = sqrt(xyz[2]);
    return new Color(xyz);
  };

  _interpolators.push(['lrgb', interpolate_lrgb]);

  chroma.average = function(colors, mode) {
    var A, alpha, c, cnt, dx, dy, first, i, l, len, o, xyz, xyz2;
    if (mode == null) {
      mode = 'rgb';
    }
    l = colors.length;
    colors = colors.map(function(c) {
      return chroma(c);
    });
    first = colors.splice(0, 1)[0];
    if (mode === 'lrgb') {
      return _average_lrgb(colors);
    }
    xyz = first.get(mode);
    cnt = [];
    dx = 0;
    dy = 0;
    for (i in xyz) {
      xyz[i] = xyz[i] || 0;
      cnt.push(!isNaN(xyz[i]) ? 1 : 0);
      if (mode.charAt(i) === 'h' && !isNaN(xyz[i])) {
        A = xyz[i] / 180 * PI;
        dx += cos(A);
        dy += sin(A);
      }
    }
    alpha = first.alpha();
    for (o = 0, len = colors.length; o < len; o++) {
      c = colors[o];
      xyz2 = c.get(mode);
      alpha += c.alpha();
      for (i in xyz) {
        if (!isNaN(xyz2[i])) {
          xyz[i] += xyz2[i];
          cnt[i] += 1;
          if (mode.charAt(i) === 'h') {
            A = xyz[i] / 180 * PI;
            dx += cos(A);
            dy += sin(A);
          }
        }
      }
    }
    for (i in xyz) {
      xyz[i] = xyz[i] / cnt[i];
      if (mode.charAt(i) === 'h') {
        A = atan2(dy / cnt[i], dx / cnt[i]) / PI * 180;
        while (A < 0) {
          A += 360;
        }
        while (A >= 360) {
          A -= 360;
        }
        xyz[i] = A;
      }
    }
    return chroma(xyz, mode).alpha(alpha / l);
  };

  hex2rgb = function(hex) {
    var a, b, g, r, rgb, u;
    if (hex.match(/^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      if (hex.length === 4 || hex.length === 7) {
        hex = hex.substr(1);
      }
      if (hex.length === 3) {
        hex = hex.split("");
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      u = parseInt(hex, 16);
      r = u >> 16;
      g = u >> 8 & 0xFF;
      b = u & 0xFF;
      return [r, g, b, 1];
    }
    if (hex.match(/^#?([A-Fa-f0-9]{8})$/)) {
      if (hex.length === 9) {
        hex = hex.substr(1);
      }
      u = parseInt(hex, 16);
      r = u >> 24 & 0xFF;
      g = u >> 16 & 0xFF;
      b = u >> 8 & 0xFF;
      a = round((u & 0xFF) / 0xFF * 100) / 100;
      return [r, g, b, a];
    }
    if ((_input.css != null) && (rgb = _input.css(hex))) {
      return rgb;
    }
    throw "unknown color: " + hex;
  };

  rgb2hex = function(channels, mode) {
    var a, b, g, hxa, r, str, u;
    if (mode == null) {
      mode = 'rgb';
    }
    r = channels[0], g = channels[1], b = channels[2], a = channels[3];
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);
    u = r << 16 | g << 8 | b;
    str = "000000" + u.toString(16);
    str = str.substr(str.length - 6);
    hxa = '0' + round(a * 255).toString(16);
    hxa = hxa.substr(hxa.length - 2);
    return "#" + (function() {
      switch (mode.toLowerCase()) {
        case 'rgba':
          return str + hxa;
        case 'argb':
          return hxa + str;
        default:
          return str;
      }
    })();
  };

  _input.hex = function(h) {
    return hex2rgb(h);
  };

  chroma.hex = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['hex']), function(){});
  };

  Color.prototype.hex = function(mode) {
    if (mode == null) {
      mode = 'rgb';
    }
    return rgb2hex(this._rgb, mode);
  };

  _guess_formats.push({
    p: 4,
    test: function(n) {
      if (arguments.length === 1 && type(n) === "string") {
        return 'hex';
      }
    }
  });

  hsl2rgb = function() {
    var args, b, c, g, h, i, l, o, r, ref, s, t1, t2, t3;
    args = unpack(arguments);
    h = args[0], s = args[1], l = args[2];
    if (s === 0) {
      r = g = b = l * 255;
    } else {
      t3 = [0, 0, 0];
      c = [0, 0, 0];
      t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
      t1 = 2 * l - t2;
      h /= 360;
      t3[0] = h + 1 / 3;
      t3[1] = h;
      t3[2] = h - 1 / 3;
      for (i = o = 0; o <= 2; i = ++o) {
        if (t3[i] < 0) {
          t3[i] += 1;
        }
        if (t3[i] > 1) {
          t3[i] -= 1;
        }
        if (6 * t3[i] < 1) {
          c[i] = t1 + (t2 - t1) * 6 * t3[i];
        } else if (2 * t3[i] < 1) {
          c[i] = t2;
        } else if (3 * t3[i] < 2) {
          c[i] = t1 + (t2 - t1) * ((2 / 3) - t3[i]) * 6;
        } else {
          c[i] = t1;
        }
      }
      ref = [round(c[0] * 255), round(c[1] * 255), round(c[2] * 255)], r = ref[0], g = ref[1], b = ref[2];
    }
    if (args.length > 3) {
      return [r, g, b, args[3]];
    } else {
      return [r, g, b];
    }
  };

  rgb2hsl = function(r, g, b) {
    var h, l, min, ref, s;
    if (r !== void 0 && r.length >= 3) {
      ref = r, r = ref[0], g = ref[1], b = ref[2];
    }
    r /= 255;
    g /= 255;
    b /= 255;
    min = Math.min(r, g, b);
    max = Math.max(r, g, b);
    l = (max + min) / 2;
    if (max === min) {
      s = 0;
      h = Number.NaN;
    } else {
      s = l < 0.5 ? (max - min) / (max + min) : (max - min) / (2 - max - min);
    }
    if (r === max) {
      h = (g - b) / (max - min);
    } else if (g === max) {
      h = 2 + (b - r) / (max - min);
    } else if (b === max) {
      h = 4 + (r - g) / (max - min);
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
    return [h, s, l];
  };

  chroma.hsl = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['hsl']), function(){});
  };

  _input.hsl = hsl2rgb;

  Color.prototype.hsl = function() {
    return rgb2hsl(this._rgb);
  };

  hsv2rgb = function() {
    var args, b, f, g, h, i, p, q, r, ref, ref1, ref2, ref3, ref4, ref5, s, t, v;
    args = unpack(arguments);
    h = args[0], s = args[1], v = args[2];
    v *= 255;
    if (s === 0) {
      r = g = b = v;
    } else {
      if (h === 360) {
        h = 0;
      }
      if (h > 360) {
        h -= 360;
      }
      if (h < 0) {
        h += 360;
      }
      h /= 60;
      i = floor(h);
      f = h - i;
      p = v * (1 - s);
      q = v * (1 - s * f);
      t = v * (1 - s * (1 - f));
      switch (i) {
        case 0:
          ref = [v, t, p], r = ref[0], g = ref[1], b = ref[2];
          break;
        case 1:
          ref1 = [q, v, p], r = ref1[0], g = ref1[1], b = ref1[2];
          break;
        case 2:
          ref2 = [p, v, t], r = ref2[0], g = ref2[1], b = ref2[2];
          break;
        case 3:
          ref3 = [p, q, v], r = ref3[0], g = ref3[1], b = ref3[2];
          break;
        case 4:
          ref4 = [t, p, v], r = ref4[0], g = ref4[1], b = ref4[2];
          break;
        case 5:
          ref5 = [v, p, q], r = ref5[0], g = ref5[1], b = ref5[2];
      }
    }
    return [r, g, b, args.length > 3 ? args[3] : 1];
  };

  rgb2hsv = function() {
    var b, delta, g, h, min, r, ref, s, v;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    min = Math.min(r, g, b);
    max = Math.max(r, g, b);
    delta = max - min;
    v = max / 255.0;
    if (max === 0) {
      h = Number.NaN;
      s = 0;
    } else {
      s = delta / max;
      if (r === max) {
        h = (g - b) / delta;
      }
      if (g === max) {
        h = 2 + (b - r) / delta;
      }
      if (b === max) {
        h = 4 + (r - g) / delta;
      }
      h *= 60;
      if (h < 0) {
        h += 360;
      }
    }
    return [h, s, v];
  };

  chroma.hsv = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['hsv']), function(){});
  };

  _input.hsv = hsv2rgb;

  Color.prototype.hsv = function() {
    return rgb2hsv(this._rgb);
  };

  num2rgb = function(num) {
    var b, g, r;
    if (type(num) === "number" && num >= 0 && num <= 0xFFFFFF) {
      r = num >> 16;
      g = (num >> 8) & 0xFF;
      b = num & 0xFF;
      return [r, g, b, 1];
    }
    console.warn("unknown num color: " + num);
    return [0, 0, 0, 1];
  };

  rgb2num = function() {
    var b, g, r, ref;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    return (r << 16) + (g << 8) + b;
  };

  chroma.num = function(num) {
    return new Color(num, 'num');
  };

  Color.prototype.num = function(mode) {
    if (mode == null) {
      mode = 'rgb';
    }
    return rgb2num(this._rgb, mode);
  };

  _input.num = num2rgb;

  _guess_formats.push({
    p: 1,
    test: function(n) {
      if (arguments.length === 1 && type(n) === "number" && n >= 0 && n <= 0xFFFFFF) {
        return 'num';
      }
    }
  });

  hcg2rgb = function() {
    var _c, _g, args, b, c, f, g, h, i, p, q, r, ref, ref1, ref2, ref3, ref4, ref5, t, v;
    args = unpack(arguments);
    h = args[0], c = args[1], _g = args[2];
    c = c / 100;
    g = g / 100 * 255;
    _c = c * 255;
    if (c === 0) {
      r = g = b = _g;
    } else {
      if (h === 360) {
        h = 0;
      }
      if (h > 360) {
        h -= 360;
      }
      if (h < 0) {
        h += 360;
      }
      h /= 60;
      i = floor(h);
      f = h - i;
      p = _g * (1 - c);
      q = p + _c * (1 - f);
      t = p + _c * f;
      v = p + _c;
      switch (i) {
        case 0:
          ref = [v, t, p], r = ref[0], g = ref[1], b = ref[2];
          break;
        case 1:
          ref1 = [q, v, p], r = ref1[0], g = ref1[1], b = ref1[2];
          break;
        case 2:
          ref2 = [p, v, t], r = ref2[0], g = ref2[1], b = ref2[2];
          break;
        case 3:
          ref3 = [p, q, v], r = ref3[0], g = ref3[1], b = ref3[2];
          break;
        case 4:
          ref4 = [t, p, v], r = ref4[0], g = ref4[1], b = ref4[2];
          break;
        case 5:
          ref5 = [v, p, q], r = ref5[0], g = ref5[1], b = ref5[2];
      }
    }
    return [r, g, b, args.length > 3 ? args[3] : 1];
  };

  rgb2hcg = function() {
    var _g, b, c, delta, g, h, min, r, ref;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    min = Math.min(r, g, b);
    max = Math.max(r, g, b);
    delta = max - min;
    c = delta * 100 / 255;
    _g = min / (255 - delta) * 100;
    if (delta === 0) {
      h = Number.NaN;
    } else {
      if (r === max) {
        h = (g - b) / delta;
      }
      if (g === max) {
        h = 2 + (b - r) / delta;
      }
      if (b === max) {
        h = 4 + (r - g) / delta;
      }
      h *= 60;
      if (h < 0) {
        h += 360;
      }
    }
    return [h, c, _g];
  };

  chroma.hcg = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['hcg']), function(){});
  };

  _input.hcg = hcg2rgb;

  Color.prototype.hcg = function() {
    return rgb2hcg(this._rgb);
  };

  css2rgb = function(css) {
    var aa, ab, hsl, i, m, o, rgb, w;
    css = css.toLowerCase();
    if ((chroma.colors != null) && chroma.colors[css]) {
      return hex2rgb(chroma.colors[css]);
    }
    if (m = css.match(/rgb\(\s*(\-?\d+),\s*(\-?\d+)\s*,\s*(\-?\d+)\s*\)/)) {
      rgb = m.slice(1, 4);
      for (i = o = 0; o <= 2; i = ++o) {
        rgb[i] = +rgb[i];
      }
      rgb[3] = 1;
    } else if (m = css.match(/rgba\(\s*(\-?\d+),\s*(\-?\d+)\s*,\s*(\-?\d+)\s*,\s*([01]|[01]?\.\d+)\)/)) {
      rgb = m.slice(1, 5);
      for (i = w = 0; w <= 3; i = ++w) {
        rgb[i] = +rgb[i];
      }
    } else if (m = css.match(/rgb\(\s*(\-?\d+(?:\.\d+)?)%,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*\)/)) {
      rgb = m.slice(1, 4);
      for (i = aa = 0; aa <= 2; i = ++aa) {
        rgb[i] = round(rgb[i] * 2.55);
      }
      rgb[3] = 1;
    } else if (m = css.match(/rgba\(\s*(\-?\d+(?:\.\d+)?)%,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)/)) {
      rgb = m.slice(1, 5);
      for (i = ab = 0; ab <= 2; i = ++ab) {
        rgb[i] = round(rgb[i] * 2.55);
      }
      rgb[3] = +rgb[3];
    } else if (m = css.match(/hsl\(\s*(\-?\d+(?:\.\d+)?),\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*\)/)) {
      hsl = m.slice(1, 4);
      hsl[1] *= 0.01;
      hsl[2] *= 0.01;
      rgb = hsl2rgb(hsl);
      rgb[3] = 1;
    } else if (m = css.match(/hsla\(\s*(\-?\d+(?:\.\d+)?),\s*(\-?\d+(?:\.\d+)?)%\s*,\s*(\-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)/)) {
      hsl = m.slice(1, 4);
      hsl[1] *= 0.01;
      hsl[2] *= 0.01;
      rgb = hsl2rgb(hsl);
      rgb[3] = +m[4];
    }
    return rgb;
  };

  rgb2css = function(rgba) {
    var mode;
    mode = rgba[3] < 1 ? 'rgba' : 'rgb';
    if (mode === 'rgb') {
      return mode + '(' + rgba.slice(0, 3).map(round).join(',') + ')';
    } else if (mode === 'rgba') {
      return mode + '(' + rgba.slice(0, 3).map(round).join(',') + ',' + rgba[3] + ')';
    } else {

    }
  };

  rnd = function(a) {
    return round(a * 100) / 100;
  };

  hsl2css = function(hsl, alpha) {
    var mode;
    mode = alpha < 1 ? 'hsla' : 'hsl';
    hsl[0] = rnd(hsl[0] || 0);
    hsl[1] = rnd(hsl[1] * 100) + '%';
    hsl[2] = rnd(hsl[2] * 100) + '%';
    if (mode === 'hsla') {
      hsl[3] = alpha;
    }
    return mode + '(' + hsl.join(',') + ')';
  };

  _input.css = function(h) {
    return css2rgb(h);
  };

  chroma.css = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['css']), function(){});
  };

  Color.prototype.css = function(mode) {
    if (mode == null) {
      mode = 'rgb';
    }
    if (mode.slice(0, 3) === 'rgb') {
      return rgb2css(this._rgb);
    } else if (mode.slice(0, 3) === 'hsl') {
      return hsl2css(this.hsl(), this.alpha());
    }
  };

  _input.named = function(name) {
    return hex2rgb(w3cx11[name]);
  };

  _guess_formats.push({
    p: 5,
    test: function(n) {
      if (arguments.length === 1 && (w3cx11[n] != null)) {
        return 'named';
      }
    }
  });

  Color.prototype.name = function(n) {
    var h, k;
    if (arguments.length) {
      if (w3cx11[n]) {
        this._rgb = hex2rgb(w3cx11[n]);
      }
      this._rgb[3] = 1;
      this;
    }
    h = this.hex();
    for (k in w3cx11) {
      if (h === w3cx11[k]) {
        return k;
      }
    }
    return h;
  };

  lch2lab = function() {

    /*
    Convert from a qualitative parameter h and a quantitative parameter l to a 24-bit pixel.
    These formulas were invented by David Dalrymple to obtain maximum contrast without going
    out of gamut if the parameters are in the range 0-1.
    
    A saturation multiplier was added by Gregor Aisch
     */
    var c, h, l, ref;
    ref = unpack(arguments), l = ref[0], c = ref[1], h = ref[2];
    h = h * DEG2RAD;
    return [l, cos(h) * c, sin(h) * c];
  };

  lch2rgb = function() {
    var L, a, args, b, c, g, h, l, r, ref, ref1;
    args = unpack(arguments);
    l = args[0], c = args[1], h = args[2];
    ref = lch2lab(l, c, h), L = ref[0], a = ref[1], b = ref[2];
    ref1 = lab2rgb(L, a, b), r = ref1[0], g = ref1[1], b = ref1[2];
    return [r, g, b, args.length > 3 ? args[3] : 1];
  };

  lab2lch = function() {
    var a, b, c, h, l, ref;
    ref = unpack(arguments), l = ref[0], a = ref[1], b = ref[2];
    c = sqrt(a * a + b * b);
    h = (atan2(b, a) * RAD2DEG + 360) % 360;
    if (round(c * 10000) === 0) {
      h = Number.NaN;
    }
    return [l, c, h];
  };

  rgb2lch = function() {
    var a, b, g, l, r, ref, ref1;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    ref1 = rgb2lab(r, g, b), l = ref1[0], a = ref1[1], b = ref1[2];
    return lab2lch(l, a, b);
  };

  chroma.lch = function() {
    var args;
    args = unpack(arguments);
    return new Color(args, 'lch');
  };

  chroma.hcl = function() {
    var args;
    args = unpack(arguments);
    return new Color(args, 'hcl');
  };

  _input.lch = lch2rgb;

  _input.hcl = function() {
    var c, h, l, ref;
    ref = unpack(arguments), h = ref[0], c = ref[1], l = ref[2];
    return lch2rgb([l, c, h]);
  };

  Color.prototype.lch = function() {
    return rgb2lch(this._rgb);
  };

  Color.prototype.hcl = function() {
    return rgb2lch(this._rgb).reverse();
  };

  rgb2cmyk = function(mode) {
    var b, c, f, g, k, m, r, ref, y;
    if (mode == null) {
      mode = 'rgb';
    }
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    r = r / 255;
    g = g / 255;
    b = b / 255;
    k = 1 - Math.max(r, Math.max(g, b));
    f = k < 1 ? 1 / (1 - k) : 0;
    c = (1 - r - k) * f;
    m = (1 - g - k) * f;
    y = (1 - b - k) * f;
    return [c, m, y, k];
  };

  cmyk2rgb = function() {
    var alpha, args, b, c, g, k, m, r, y;
    args = unpack(arguments);
    c = args[0], m = args[1], y = args[2], k = args[3];
    alpha = args.length > 4 ? args[4] : 1;
    if (k === 1) {
      return [0, 0, 0, alpha];
    }
    r = c >= 1 ? 0 : 255 * (1 - c) * (1 - k);
    g = m >= 1 ? 0 : 255 * (1 - m) * (1 - k);
    b = y >= 1 ? 0 : 255 * (1 - y) * (1 - k);
    return [r, g, b, alpha];
  };

  _input.cmyk = function() {
    return cmyk2rgb(unpack(arguments));
  };

  chroma.cmyk = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['cmyk']), function(){});
  };

  Color.prototype.cmyk = function() {
    return rgb2cmyk(this._rgb);
  };

  _input.gl = function() {
    var i, k, o, rgb, v;
    rgb = (function() {
      var ref, results;
      ref = unpack(arguments);
      results = [];
      for (k in ref) {
        v = ref[k];
        results.push(v);
      }
      return results;
    }).apply(this, arguments);
    for (i = o = 0; o <= 2; i = ++o) {
      rgb[i] *= 255;
    }
    return rgb;
  };

  chroma.gl = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['gl']), function(){});
  };

  Color.prototype.gl = function() {
    var rgb;
    rgb = this._rgb;
    return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, rgb[3]];
  };

  rgb2luminance = function(r, g, b) {
    var ref;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    r = luminance_x(r);
    g = luminance_x(g);
    b = luminance_x(b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  luminance_x = function(x) {
    x /= 255;
    if (x <= 0.03928) {
      return x / 12.92;
    } else {
      return pow((x + 0.055) / 1.055, 2.4);
    }
  };

  interpolate_rgb = function(col1, col2, f, m) {
    var xyz0, xyz1;
    xyz0 = col1._rgb;
    xyz1 = col2._rgb;
    return new Color(xyz0[0] + f * (xyz1[0] - xyz0[0]), xyz0[1] + f * (xyz1[1] - xyz0[1]), xyz0[2] + f * (xyz1[2] - xyz0[2]), m);
  };

  _interpolators.push(['rgb', interpolate_rgb]);

  Color.prototype.luminance = function(lum, mode) {
    var cur_lum, eps, max_iter, test;
    if (mode == null) {
      mode = 'rgb';
    }
    if (!arguments.length) {
      return rgb2luminance(this._rgb);
    }
    if (lum === 0) {
      this._rgb = [0, 0, 0, this._rgb[3]];
    } else if (lum === 1) {
      this._rgb = [255, 255, 255, this._rgb[3]];
    } else {
      eps = 1e-7;
      max_iter = 20;
      test = function(l, h) {
        var lm, m;
        m = l.interpolate(h, 0.5, mode);
        lm = m.luminance();
        if (Math.abs(lum - lm) < eps || !max_iter--) {
          return m;
        }
        if (lm > lum) {
          return test(l, m);
        }
        return test(m, h);
      };
      cur_lum = rgb2luminance(this._rgb);
      this._rgb = (cur_lum > lum ? test(chroma('black'), this) : test(this, chroma('white'))).rgba();
    }
    return this;
  };

  temperature2rgb = function(kelvin) {
    var b, g, r, temp;
    temp = kelvin / 100;
    if (temp < 66) {
      r = 255;
      g = -155.25485562709179 - 0.44596950469579133 * (g = temp - 2) + 104.49216199393888 * log(g);
      b = temp < 20 ? 0 : -254.76935184120902 + 0.8274096064007395 * (b = temp - 10) + 115.67994401066147 * log(b);
    } else {
      r = 351.97690566805693 + 0.114206453784165 * (r = temp - 55) - 40.25366309332127 * log(r);
      g = 325.4494125711974 + 0.07943456536662342 * (g = temp - 50) - 28.0852963507957 * log(g);
      b = 255;
    }
    return [r, g, b];
  };

  rgb2temperature = function() {
    var b, eps, g, maxTemp, minTemp, r, ref, rgb, temp;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    minTemp = 1000;
    maxTemp = 40000;
    eps = 0.4;
    while (maxTemp - minTemp > eps) {
      temp = (maxTemp + minTemp) * 0.5;
      rgb = temperature2rgb(temp);
      if ((rgb[2] / rgb[0]) >= (b / r)) {
        maxTemp = temp;
      } else {
        minTemp = temp;
      }
    }
    return round(temp);
  };

  chroma.temperature = chroma.kelvin = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['temperature']), function(){});
  };

  _input.temperature = _input.kelvin = _input.K = temperature2rgb;

  Color.prototype.temperature = function() {
    return rgb2temperature(this._rgb);
  };

  Color.prototype.kelvin = Color.prototype.temperature;

  chroma.contrast = function(a, b) {
    var l1, l2, ref, ref1;
    if ((ref = type(a)) === 'string' || ref === 'number') {
      a = new Color(a);
    }
    if ((ref1 = type(b)) === 'string' || ref1 === 'number') {
      b = new Color(b);
    }
    l1 = a.luminance();
    l2 = b.luminance();
    if (l1 > l2) {
      return (l1 + 0.05) / (l2 + 0.05);
    } else {
      return (l2 + 0.05) / (l1 + 0.05);
    }
  };

  chroma.distance = function(a, b, mode) {
    var d, i, l1, l2, ref, ref1, sum_sq;
    if (mode == null) {
      mode = 'lab';
    }
    if ((ref = type(a)) === 'string' || ref === 'number') {
      a = new Color(a);
    }
    if ((ref1 = type(b)) === 'string' || ref1 === 'number') {
      b = new Color(b);
    }
    l1 = a.get(mode);
    l2 = b.get(mode);
    sum_sq = 0;
    for (i in l1) {
      d = (l1[i] || 0) - (l2[i] || 0);
      sum_sq += d * d;
    }
    return Math.sqrt(sum_sq);
  };

  chroma.deltaE = function(a, b, L, C) {
    var L1, L2, a1, a2, b1, b2, c1, c2, c4, dH2, delA, delB, delC, delL, f, h1, ref, ref1, ref2, ref3, sc, sh, sl, t, v1, v2, v3;
    if (L == null) {
      L = 1;
    }
    if (C == null) {
      C = 1;
    }
    if ((ref = type(a)) === 'string' || ref === 'number') {
      a = new Color(a);
    }
    if ((ref1 = type(b)) === 'string' || ref1 === 'number') {
      b = new Color(b);
    }
    ref2 = a.lab(), L1 = ref2[0], a1 = ref2[1], b1 = ref2[2];
    ref3 = b.lab(), L2 = ref3[0], a2 = ref3[1], b2 = ref3[2];
    c1 = sqrt(a1 * a1 + b1 * b1);
    c2 = sqrt(a2 * a2 + b2 * b2);
    sl = L1 < 16.0 ? 0.511 : (0.040975 * L1) / (1.0 + 0.01765 * L1);
    sc = (0.0638 * c1) / (1.0 + 0.0131 * c1) + 0.638;
    h1 = c1 < 0.000001 ? 0.0 : (atan2(b1, a1) * 180.0) / PI;
    while (h1 < 0) {
      h1 += 360;
    }
    while (h1 >= 360) {
      h1 -= 360;
    }
    t = (h1 >= 164.0) && (h1 <= 345.0) ? 0.56 + abs(0.2 * cos((PI * (h1 + 168.0)) / 180.0)) : 0.36 + abs(0.4 * cos((PI * (h1 + 35.0)) / 180.0));
    c4 = c1 * c1 * c1 * c1;
    f = sqrt(c4 / (c4 + 1900.0));
    sh = sc * (f * t + 1.0 - f);
    delL = L1 - L2;
    delC = c1 - c2;
    delA = a1 - a2;
    delB = b1 - b2;
    dH2 = delA * delA + delB * delB - delC * delC;
    v1 = delL / (L * sl);
    v2 = delC / (C * sc);
    v3 = sh;
    return sqrt(v1 * v1 + v2 * v2 + (dH2 / (v3 * v3)));
  };

  Color.prototype.get = function(modechan) {
    var channel, i, me, mode, ref, src;
    me = this;
    ref = modechan.split('.'), mode = ref[0], channel = ref[1];
    src = me[mode]();
    if (channel) {
      i = mode.indexOf(channel);
      if (i > -1) {
        return src[i];
      } else {
        return console.warn('unknown channel ' + channel + ' in mode ' + mode);
      }
    } else {
      return src;
    }
  };

  Color.prototype.set = function(modechan, value) {
    var channel, i, me, mode, ref, src;
    me = this;
    ref = modechan.split('.'), mode = ref[0], channel = ref[1];
    if (channel) {
      src = me[mode]();
      i = mode.indexOf(channel);
      if (i > -1) {
        if (type(value) === 'string') {
          switch (value.charAt(0)) {
            case '+':
              src[i] += +value;
              break;
            case '-':
              src[i] += +value;
              break;
            case '*':
              src[i] *= +(value.substr(1));
              break;
            case '/':
              src[i] /= +(value.substr(1));
              break;
            default:
              src[i] = +value;
          }
        } else {
          src[i] = value;
        }
      } else {
        console.warn('unknown channel ' + channel + ' in mode ' + mode);
      }
    } else {
      src = value;
    }
    return chroma(src, mode).alpha(me.alpha());
  };

  Color.prototype.clipped = function() {
    return this._rgb._clipped || false;
  };

  Color.prototype.alpha = function(a) {
    if (arguments.length) {
      return chroma.rgb([this._rgb[0], this._rgb[1], this._rgb[2], a]);
    }
    return this._rgb[3];
  };

  Color.prototype.darken = function(amount) {
    var lab, me;
    if (amount == null) {
      amount = 1;
    }
    me = this;
    lab = me.lab();
    lab[0] -= LAB_CONSTANTS.Kn * amount;
    return chroma.lab(lab).alpha(me.alpha());
  };

  Color.prototype.brighten = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return this.darken(-amount);
  };

  Color.prototype.darker = Color.prototype.darken;

  Color.prototype.brighter = Color.prototype.brighten;

  Color.prototype.saturate = function(amount) {
    var lch, me;
    if (amount == null) {
      amount = 1;
    }
    me = this;
    lch = me.lch();
    lch[1] += amount * LAB_CONSTANTS.Kn;
    if (lch[1] < 0) {
      lch[1] = 0;
    }
    return chroma.lch(lch).alpha(me.alpha());
  };

  Color.prototype.desaturate = function(amount) {
    if (amount == null) {
      amount = 1;
    }
    return this.saturate(-amount);
  };

  Color.prototype.premultiply = function() {
    var a, rgb;
    rgb = this.rgb();
    a = this.alpha();
    return chroma(rgb[0] * a, rgb[1] * a, rgb[2] * a, a);
  };

  blend = function(bottom, top, mode) {
    if (!blend[mode]) {
      throw 'unknown blend mode ' + mode;
    }
    return blend[mode](bottom, top);
  };

  blend_f = function(f) {
    return function(bottom, top) {
      var c0, c1;
      c0 = chroma(top).rgb();
      c1 = chroma(bottom).rgb();
      return chroma(f(c0, c1), 'rgb');
    };
  };

  each = function(f) {
    return function(c0, c1) {
      var i, o, out;
      out = [];
      for (i = o = 0; o <= 3; i = ++o) {
        out[i] = f(c0[i], c1[i]);
      }
      return out;
    };
  };

  normal = function(a, b) {
    return a;
  };

  multiply = function(a, b) {
    return a * b / 255;
  };

  darken = function(a, b) {
    if (a > b) {
      return b;
    } else {
      return a;
    }
  };

  lighten = function(a, b) {
    if (a > b) {
      return a;
    } else {
      return b;
    }
  };

  screen = function(a, b) {
    return 255 * (1 - (1 - a / 255) * (1 - b / 255));
  };

  overlay = function(a, b) {
    if (b < 128) {
      return 2 * a * b / 255;
    } else {
      return 255 * (1 - 2 * (1 - a / 255) * (1 - b / 255));
    }
  };

  burn = function(a, b) {
    return 255 * (1 - (1 - b / 255) / (a / 255));
  };

  dodge = function(a, b) {
    if (a === 255) {
      return 255;
    }
    a = 255 * (b / 255) / (1 - a / 255);
    if (a > 255) {
      return 255;
    } else {
      return a;
    }
  };

  blend.normal = blend_f(each(normal));

  blend.multiply = blend_f(each(multiply));

  blend.screen = blend_f(each(screen));

  blend.overlay = blend_f(each(overlay));

  blend.darken = blend_f(each(darken));

  blend.lighten = blend_f(each(lighten));

  blend.dodge = blend_f(each(dodge));

  blend.burn = blend_f(each(burn));

  chroma.blend = blend;

  chroma.analyze = function(data) {
    var len, o, r, val;
    r = {
      min: Number.MAX_VALUE,
      max: Number.MAX_VALUE * -1,
      sum: 0,
      values: [],
      count: 0
    };
    for (o = 0, len = data.length; o < len; o++) {
      val = data[o];
      if ((val != null) && !isNaN(val)) {
        r.values.push(val);
        r.sum += val;
        if (val < r.min) {
          r.min = val;
        }
        if (val > r.max) {
          r.max = val;
        }
        r.count += 1;
      }
    }
    r.domain = [r.min, r.max];
    r.limits = function(mode, num) {
      return chroma.limits(r, mode, num);
    };
    return r;
  };

  chroma.scale = function(colors, positions) {
    var _classes, _colorCache, _colors, _correctLightness, _domain, _fixed, _max, _min, _mode, _nacol, _out, _padding, _pos, _spread, _useCache, classifyValue, f, getClass, getColor, resetCache, setColors, tmap;
    _mode = 'rgb';
    _nacol = chroma('#ccc');
    _spread = 0;
    _fixed = false;
    _domain = [0, 1];
    _pos = [];
    _padding = [0, 0];
    _classes = false;
    _colors = [];
    _out = false;
    _min = 0;
    _max = 1;
    _correctLightness = false;
    _colorCache = {};
    _useCache = true;
    setColors = function(colors) {
      var c, col, o, ref, ref1, w;
      if (colors == null) {
        colors = ['#fff', '#000'];
      }
      if ((colors != null) && type(colors) === 'string' && (chroma.brewer != null)) {
        colors = chroma.brewer[colors] || chroma.brewer[colors.toLowerCase()] || colors;
      }
      if (type(colors) === 'array') {
        colors = colors.slice(0);
        for (c = o = 0, ref = colors.length - 1; 0 <= ref ? o <= ref : o >= ref; c = 0 <= ref ? ++o : --o) {
          col = colors[c];
          if (type(col) === "string") {
            colors[c] = chroma(col);
          }
        }
        _pos.length = 0;
        for (c = w = 0, ref1 = colors.length - 1; 0 <= ref1 ? w <= ref1 : w >= ref1; c = 0 <= ref1 ? ++w : --w) {
          _pos.push(c / (colors.length - 1));
        }
      }
      resetCache();
      return _colors = colors;
    };
    getClass = function(value) {
      var i, n;
      if (_classes != null) {
        n = _classes.length - 1;
        i = 0;
        while (i < n && value >= _classes[i]) {
          i++;
        }
        return i - 1;
      }
      return 0;
    };
    tmap = function(t) {
      return t;
    };
    classifyValue = function(value) {
      var i, maxc, minc, n, val;
      val = value;
      if (_classes.length > 2) {
        n = _classes.length - 1;
        i = getClass(value);
        minc = _classes[0] + (_classes[1] - _classes[0]) * (0 + _spread * 0.5);
        maxc = _classes[n - 1] + (_classes[n] - _classes[n - 1]) * (1 - _spread * 0.5);
        val = _min + ((_classes[i] + (_classes[i + 1] - _classes[i]) * 0.5 - minc) / (maxc - minc)) * (_max - _min);
      }
      return val;
    };
    getColor = function(val, bypassMap) {
      var c, col, i, k, o, p, ref, t;
      if (bypassMap == null) {
        bypassMap = false;
      }
      if (isNaN(val)) {
        return _nacol;
      }
      if (!bypassMap) {
        if (_classes && _classes.length > 2) {
          c = getClass(val);
          t = c / (_classes.length - 2);
          t = _padding[0] + (t * (1 - _padding[0] - _padding[1]));
        } else if (_max !== _min) {
          t = (val - _min) / (_max - _min);
          t = _padding[0] + (t * (1 - _padding[0] - _padding[1]));
          t = Math.min(1, Math.max(0, t));
        } else {
          t = 1;
        }
      } else {
        t = val;
      }
      if (!bypassMap) {
        t = tmap(t);
      }
      k = Math.floor(t * 10000);
      if (_useCache && _colorCache[k]) {
        col = _colorCache[k];
      } else {
        if (type(_colors) === 'array') {
          for (i = o = 0, ref = _pos.length - 1; 0 <= ref ? o <= ref : o >= ref; i = 0 <= ref ? ++o : --o) {
            p = _pos[i];
            if (t <= p) {
              col = _colors[i];
              break;
            }
            if (t >= p && i === _pos.length - 1) {
              col = _colors[i];
              break;
            }
            if (t > p && t < _pos[i + 1]) {
              t = (t - p) / (_pos[i + 1] - p);
              col = chroma.interpolate(_colors[i], _colors[i + 1], t, _mode);
              break;
            }
          }
        } else if (type(_colors) === 'function') {
          col = _colors(t);
        }
        if (_useCache) {
          _colorCache[k] = col;
        }
      }
      return col;
    };
    resetCache = function() {
      return _colorCache = {};
    };
    setColors(colors);
    f = function(v) {
      var c;
      c = chroma(getColor(v));
      if (_out && c[_out]) {
        return c[_out]();
      } else {
        return c;
      }
    };
    f.classes = function(classes) {
      var d;
      if (classes != null) {
        if (type(classes) === 'array') {
          _classes = classes;
          _domain = [classes[0], classes[classes.length - 1]];
        } else {
          d = chroma.analyze(_domain);
          if (classes === 0) {
            _classes = [d.min, d.max];
          } else {
            _classes = chroma.limits(d, 'e', classes);
          }
        }
        return f;
      }
      return _classes;
    };
    f.domain = function(domain) {
      var c, d, k, len, o, ref, w;
      if (!arguments.length) {
        return _domain;
      }
      _min = domain[0];
      _max = domain[domain.length - 1];
      _pos = [];
      k = _colors.length;
      if (domain.length === k && _min !== _max) {
        for (o = 0, len = domain.length; o < len; o++) {
          d = domain[o];
          _pos.push((d - _min) / (_max - _min));
        }
      } else {
        for (c = w = 0, ref = k - 1; 0 <= ref ? w <= ref : w >= ref; c = 0 <= ref ? ++w : --w) {
          _pos.push(c / (k - 1));
        }
      }
      _domain = [_min, _max];
      return f;
    };
    f.mode = function(_m) {
      if (!arguments.length) {
        return _mode;
      }
      _mode = _m;
      resetCache();
      return f;
    };
    f.range = function(colors, _pos) {
      setColors(colors, _pos);
      return f;
    };
    f.out = function(_o) {
      _out = _o;
      return f;
    };
    f.spread = function(val) {
      if (!arguments.length) {
        return _spread;
      }
      _spread = val;
      return f;
    };
    f.correctLightness = function(v) {
      if (v == null) {
        v = true;
      }
      _correctLightness = v;
      resetCache();
      if (_correctLightness) {
        tmap = function(t) {
          var L0, L1, L_actual, L_diff, L_ideal, max_iter, pol, t0, t1;
          L0 = getColor(0, true).lab()[0];
          L1 = getColor(1, true).lab()[0];
          pol = L0 > L1;
          L_actual = getColor(t, true).lab()[0];
          L_ideal = L0 + (L1 - L0) * t;
          L_diff = L_actual - L_ideal;
          t0 = 0;
          t1 = 1;
          max_iter = 20;
          while (Math.abs(L_diff) > 1e-2 && max_iter-- > 0) {
            (function() {
              if (pol) {
                L_diff *= -1;
              }
              if (L_diff < 0) {
                t0 = t;
                t += (t1 - t) * 0.5;
              } else {
                t1 = t;
                t += (t0 - t) * 0.5;
              }
              L_actual = getColor(t, true).lab()[0];
              return L_diff = L_actual - L_ideal;
            })();
          }
          return t;
        };
      } else {
        tmap = function(t) {
          return t;
        };
      }
      return f;
    };
    f.padding = function(p) {
      if (p != null) {
        if (type(p) === 'number') {
          p = [p, p];
        }
        _padding = p;
        return f;
      } else {
        return _padding;
      }
    };
    f.colors = function(numColors, out) {
      var dd, dm, i, o, ref, result, results, samples, w;
      if (arguments.length < 2) {
        out = 'hex';
      }
      result = [];
      if (arguments.length === 0) {
        result = _colors.slice(0);
      } else if (numColors === 1) {
        result = [f(0.5)];
      } else if (numColors > 1) {
        dm = _domain[0];
        dd = _domain[1] - dm;
        result = (function() {
          results = [];
          for (var o = 0; 0 <= numColors ? o < numColors : o > numColors; 0 <= numColors ? o++ : o--){ results.push(o); }
          return results;
        }).apply(this).map(function(i) {
          return f(dm + i / (numColors - 1) * dd);
        });
      } else {
        colors = [];
        samples = [];
        if (_classes && _classes.length > 2) {
          for (i = w = 1, ref = _classes.length; 1 <= ref ? w < ref : w > ref; i = 1 <= ref ? ++w : --w) {
            samples.push((_classes[i - 1] + _classes[i]) * 0.5);
          }
        } else {
          samples = _domain;
        }
        result = samples.map(function(v) {
          return f(v);
        });
      }
      if (chroma[out]) {
        result = result.map(function(c) {
          return c[out]();
        });
      }
      return result;
    };
    f.cache = function(c) {
      if (c != null) {
        return _useCache = c;
      } else {
        return _useCache;
      }
    };
    return f;
  };

  if (chroma.scales == null) {
    chroma.scales = {};
  }

  chroma.scales.cool = function() {
    return chroma.scale([chroma.hsl(180, 1, .9), chroma.hsl(250, .7, .4)]);
  };

  chroma.scales.hot = function() {
    return chroma.scale(['#000', '#f00', '#ff0', '#fff'], [0, .25, .75, 1]).mode('rgb');
  };

  chroma.analyze = function(data, key, filter) {
    var add, k, len, o, r, val, visit;
    r = {
      min: Number.MAX_VALUE,
      max: Number.MAX_VALUE * -1,
      sum: 0,
      values: [],
      count: 0
    };
    if (filter == null) {
      filter = function() {
        return true;
      };
    }
    add = function(val) {
      if ((val != null) && !isNaN(val)) {
        r.values.push(val);
        r.sum += val;
        if (val < r.min) {
          r.min = val;
        }
        if (val > r.max) {
          r.max = val;
        }
        r.count += 1;
      }
    };
    visit = function(val, k) {
      if (filter(val, k)) {
        if ((key != null) && type(key) === 'function') {
          return add(key(val));
        } else if ((key != null) && type(key) === 'string' || type(key) === 'number') {
          return add(val[key]);
        } else {
          return add(val);
        }
      }
    };
    if (type(data) === 'array') {
      for (o = 0, len = data.length; o < len; o++) {
        val = data[o];
        visit(val);
      }
    } else {
      for (k in data) {
        val = data[k];
        visit(val, k);
      }
    }
    r.domain = [r.min, r.max];
    r.limits = function(mode, num) {
      return chroma.limits(r, mode, num);
    };
    return r;
  };

  chroma.limits = function(data, mode, num) {
    var aa, ab, ac, ad, ae, af, ag, ah, ai, aj, ak, al, am, assignments, best, centroids, cluster, clusterSizes, dist, i, j, kClusters, limits, max_log, min, min_log, mindist, n, nb_iters, newCentroids, o, p, pb, pr, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, repeat, sum$$1, tmpKMeansBreaks, v, value, values, w;
    if (mode == null) {
      mode = 'equal';
    }
    if (num == null) {
      num = 7;
    }
    if (type(data) === 'array') {
      data = chroma.analyze(data);
    }
    min = data.min;
    max = data.max;
    sum$$1 = data.sum;
    values = data.values.sort(function(a, b) {
      return a - b;
    });
    if (num === 1) {
      return [min, max];
    }
    limits = [];
    if (mode.substr(0, 1) === 'c') {
      limits.push(min);
      limits.push(max);
    }
    if (mode.substr(0, 1) === 'e') {
      limits.push(min);
      for (i = o = 1, ref = num - 1; 1 <= ref ? o <= ref : o >= ref; i = 1 <= ref ? ++o : --o) {
        limits.push(min + (i / num) * (max - min));
      }
      limits.push(max);
    } else if (mode.substr(0, 1) === 'l') {
      if (min <= 0) {
        throw 'Logarithmic scales are only possible for values > 0';
      }
      min_log = Math.LOG10E * log(min);
      max_log = Math.LOG10E * log(max);
      limits.push(min);
      for (i = w = 1, ref1 = num - 1; 1 <= ref1 ? w <= ref1 : w >= ref1; i = 1 <= ref1 ? ++w : --w) {
        limits.push(pow(10, min_log + (i / num) * (max_log - min_log)));
      }
      limits.push(max);
    } else if (mode.substr(0, 1) === 'q') {
      limits.push(min);
      for (i = aa = 1, ref2 = num - 1; 1 <= ref2 ? aa <= ref2 : aa >= ref2; i = 1 <= ref2 ? ++aa : --aa) {
        p = (values.length - 1) * i / num;
        pb = floor(p);
        if (pb === p) {
          limits.push(values[pb]);
        } else {
          pr = p - pb;
          limits.push(values[pb] * (1 - pr) + values[pb + 1] * pr);
        }
      }
      limits.push(max);
    } else if (mode.substr(0, 1) === 'k') {

      /*
      implementation based on
      http://code.google.com/p/figue/source/browse/trunk/figue.js#336
      simplified for 1-d input values
       */
      n = values.length;
      assignments = new Array(n);
      clusterSizes = new Array(num);
      repeat = true;
      nb_iters = 0;
      centroids = null;
      centroids = [];
      centroids.push(min);
      for (i = ab = 1, ref3 = num - 1; 1 <= ref3 ? ab <= ref3 : ab >= ref3; i = 1 <= ref3 ? ++ab : --ab) {
        centroids.push(min + (i / num) * (max - min));
      }
      centroids.push(max);
      while (repeat) {
        for (j = ac = 0, ref4 = num - 1; 0 <= ref4 ? ac <= ref4 : ac >= ref4; j = 0 <= ref4 ? ++ac : --ac) {
          clusterSizes[j] = 0;
        }
        for (i = ad = 0, ref5 = n - 1; 0 <= ref5 ? ad <= ref5 : ad >= ref5; i = 0 <= ref5 ? ++ad : --ad) {
          value = values[i];
          mindist = Number.MAX_VALUE;
          for (j = ae = 0, ref6 = num - 1; 0 <= ref6 ? ae <= ref6 : ae >= ref6; j = 0 <= ref6 ? ++ae : --ae) {
            dist = abs(centroids[j] - value);
            if (dist < mindist) {
              mindist = dist;
              best = j;
            }
          }
          clusterSizes[best]++;
          assignments[i] = best;
        }
        newCentroids = new Array(num);
        for (j = af = 0, ref7 = num - 1; 0 <= ref7 ? af <= ref7 : af >= ref7; j = 0 <= ref7 ? ++af : --af) {
          newCentroids[j] = null;
        }
        for (i = ag = 0, ref8 = n - 1; 0 <= ref8 ? ag <= ref8 : ag >= ref8; i = 0 <= ref8 ? ++ag : --ag) {
          cluster = assignments[i];
          if (newCentroids[cluster] === null) {
            newCentroids[cluster] = values[i];
          } else {
            newCentroids[cluster] += values[i];
          }
        }
        for (j = ah = 0, ref9 = num - 1; 0 <= ref9 ? ah <= ref9 : ah >= ref9; j = 0 <= ref9 ? ++ah : --ah) {
          newCentroids[j] *= 1 / clusterSizes[j];
        }
        repeat = false;
        for (j = ai = 0, ref10 = num - 1; 0 <= ref10 ? ai <= ref10 : ai >= ref10; j = 0 <= ref10 ? ++ai : --ai) {
          if (newCentroids[j] !== centroids[i]) {
            repeat = true;
            break;
          }
        }
        centroids = newCentroids;
        nb_iters++;
        if (nb_iters > 200) {
          repeat = false;
        }
      }
      kClusters = {};
      for (j = aj = 0, ref11 = num - 1; 0 <= ref11 ? aj <= ref11 : aj >= ref11; j = 0 <= ref11 ? ++aj : --aj) {
        kClusters[j] = [];
      }
      for (i = ak = 0, ref12 = n - 1; 0 <= ref12 ? ak <= ref12 : ak >= ref12; i = 0 <= ref12 ? ++ak : --ak) {
        cluster = assignments[i];
        kClusters[cluster].push(values[i]);
      }
      tmpKMeansBreaks = [];
      for (j = al = 0, ref13 = num - 1; 0 <= ref13 ? al <= ref13 : al >= ref13; j = 0 <= ref13 ? ++al : --al) {
        tmpKMeansBreaks.push(kClusters[j][0]);
        tmpKMeansBreaks.push(kClusters[j][kClusters[j].length - 1]);
      }
      tmpKMeansBreaks = tmpKMeansBreaks.sort(function(a, b) {
        return a - b;
      });
      limits.push(tmpKMeansBreaks[0]);
      for (i = am = 1, ref14 = tmpKMeansBreaks.length - 1; am <= ref14; i = am += 2) {
        v = tmpKMeansBreaks[i];
        if (!isNaN(v) && limits.indexOf(v) === -1) {
          limits.push(v);
        }
      }
    }
    return limits;
  };

  hsi2rgb = function(h, s, i) {

    /*
    borrowed from here:
    http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/hsi2rgb.cpp
     */
    var args, b, g, r;
    args = unpack(arguments);
    h = args[0], s = args[1], i = args[2];
    if (isNaN(h)) {
      h = 0;
    }
    h /= 360;
    if (h < 1 / 3) {
      b = (1 - s) / 3;
      r = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
      g = 1 - (b + r);
    } else if (h < 2 / 3) {
      h -= 1 / 3;
      r = (1 - s) / 3;
      g = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
      b = 1 - (r + g);
    } else {
      h -= 2 / 3;
      g = (1 - s) / 3;
      b = (1 + s * cos(TWOPI * h) / cos(PITHIRD - TWOPI * h)) / 3;
      r = 1 - (g + b);
    }
    r = limit(i * r * 3);
    g = limit(i * g * 3);
    b = limit(i * b * 3);
    return [r * 255, g * 255, b * 255, args.length > 3 ? args[3] : 1];
  };

  rgb2hsi = function() {

    /*
    borrowed from here:
    http://hummer.stanford.edu/museinfo/doc/examples/humdrum/keyscape2/rgb2hsi.cpp
     */
    var b, g, h, i, min, r, ref, s;
    ref = unpack(arguments), r = ref[0], g = ref[1], b = ref[2];
    TWOPI = Math.PI * 2;
    r /= 255;
    g /= 255;
    b /= 255;
    min = Math.min(r, g, b);
    i = (r + g + b) / 3;
    s = 1 - min / i;
    if (s === 0) {
      h = 0;
    } else {
      h = ((r - g) + (r - b)) / 2;
      h /= Math.sqrt((r - g) * (r - g) + (r - b) * (g - b));
      h = Math.acos(h);
      if (b > g) {
        h = TWOPI - h;
      }
      h /= TWOPI;
    }
    return [h * 360, s, i];
  };

  chroma.hsi = function() {
    return (function(func, args, ctor) {
      ctor.prototype = func.prototype;
      var child = new ctor, result = func.apply(child, args);
      return Object(result) === result ? result : child;
    })(Color, slice.call(arguments).concat(['hsi']), function(){});
  };

  _input.hsi = hsi2rgb;

  Color.prototype.hsi = function() {
    return rgb2hsi(this._rgb);
  };

  interpolate_hsx = function(col1, col2, f, m) {
    var dh, hue, hue0, hue1, lbv, lbv0, lbv1, res, sat, sat0, sat1, xyz0, xyz1;
    if (m === 'hsl') {
      xyz0 = col1.hsl();
      xyz1 = col2.hsl();
    } else if (m === 'hsv') {
      xyz0 = col1.hsv();
      xyz1 = col2.hsv();
    } else if (m === 'hcg') {
      xyz0 = col1.hcg();
      xyz1 = col2.hcg();
    } else if (m === 'hsi') {
      xyz0 = col1.hsi();
      xyz1 = col2.hsi();
    } else if (m === 'lch' || m === 'hcl') {
      m = 'hcl';
      xyz0 = col1.hcl();
      xyz1 = col2.hcl();
    }
    if (m.substr(0, 1) === 'h') {
      hue0 = xyz0[0], sat0 = xyz0[1], lbv0 = xyz0[2];
      hue1 = xyz1[0], sat1 = xyz1[1], lbv1 = xyz1[2];
    }
    if (!isNaN(hue0) && !isNaN(hue1)) {
      if (hue1 > hue0 && hue1 - hue0 > 180) {
        dh = hue1 - (hue0 + 360);
      } else if (hue1 < hue0 && hue0 - hue1 > 180) {
        dh = hue1 + 360 - hue0;
      } else {
        dh = hue1 - hue0;
      }
      hue = hue0 + f * dh;
    } else if (!isNaN(hue0)) {
      hue = hue0;
      if ((lbv1 === 1 || lbv1 === 0) && m !== 'hsv') {
        sat = sat0;
      }
    } else if (!isNaN(hue1)) {
      hue = hue1;
      if ((lbv0 === 1 || lbv0 === 0) && m !== 'hsv') {
        sat = sat1;
      }
    } else {
      hue = Number.NaN;
    }
    if (sat == null) {
      sat = sat0 + f * (sat1 - sat0);
    }
    lbv = lbv0 + f * (lbv1 - lbv0);
    return res = chroma[m](hue, sat, lbv);
  };

  _interpolators = _interpolators.concat((function() {
    var len, o, ref, results;
    ref = ['hsv', 'hsl', 'hsi', 'hcl', 'lch', 'hcg'];
    results = [];
    for (o = 0, len = ref.length; o < len; o++) {
      m = ref[o];
      results.push([m, interpolate_hsx]);
    }
    return results;
  })());

  interpolate_num = function(col1, col2, f, m) {
    var n1, n2;
    n1 = col1.num();
    n2 = col2.num();
    return chroma.num(n1 + (n2 - n1) * f, 'num');
  };

  _interpolators.push(['num', interpolate_num]);

  interpolate_lab = function(col1, col2, f, m) {
    var res, xyz0, xyz1;
    xyz0 = col1.lab();
    xyz1 = col2.lab();
    return res = new Color(xyz0[0] + f * (xyz1[0] - xyz0[0]), xyz0[1] + f * (xyz1[1] - xyz0[1]), xyz0[2] + f * (xyz1[2] - xyz0[2]), m);
  };

  _interpolators.push(['lab', interpolate_lab]);

}).call(commonjsGlobal);
});

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

var namespace = function(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name;
};

function creatorInherit(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

var creator = function(name) {
  var fullname = namespace(name);
  return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
};

var matcher = function(selector) {
  return function() {
    return this.matches(selector);
  };
};

if (typeof document !== "undefined") {
  var element = document.documentElement;
  if (!element.matches) {
    var vendorMatches = element.webkitMatchesSelector
        || element.msMatchesSelector
        || element.mozMatchesSelector
        || element.oMatchesSelector;
    matcher = function(selector) {
      return function() {
        return vendorMatches.call(this, selector);
      };
    };
  }
}

var matcher$1 = matcher;

var filterEvents = {};

var event$1 = null;

if (typeof document !== "undefined") {
  var element$1 = document.documentElement;
  if (!("onmouseenter" in element$1)) {
    filterEvents = {mouseenter: "mouseover", mouseleave: "mouseout"};
  }
}

function filterContextListener(listener, index, group) {
  listener = contextListener(listener, index, group);
  return function(event$$1) {
    var related = event$$1.relatedTarget;
    if (!related || (related !== this && !(related.compareDocumentPosition(this) & 8))) {
      listener.call(this, event$$1);
    }
  };
}

function contextListener(listener, index, group) {
  return function(event1) {
    var event0 = event$1; // Events can be reentrant (e.g., focus).
    event$1 = event1;
    try {
      listener.call(this, this.__data__, index, group);
    } finally {
      event$1 = event0;
    }
  };
}

function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {type: t, name: name};
  });
}

function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}

function onAdd(typename, value, capture) {
  var wrap = filterEvents.hasOwnProperty(typename.type) ? filterContextListener : contextListener;
  return function(d, i, group) {
    var on = this.__on, o, listener = wrap(value, i, group);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.capture);
        this.addEventListener(o.type, o.listener = listener, o.capture = capture);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, capture);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, capture: capture};
    if (!on) this.__on = [o];
    else on.push(o);
  };
}

var selection_on = function(typename, value, capture) {
  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  if (capture == null) capture = false;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, capture));
  return this;
};

function none() {}

var selector = function(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
};

var selection_select = function(select$$1) {
  if (typeof select$$1 !== "function") select$$1 = selector(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select$$1.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection(subgroups, this._parents);
};

function empty() {
  return [];
}

var selectorAll = function(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
};

var selection_selectAll = function(select$$1) {
  if (typeof select$$1 !== "function") select$$1 = selectorAll(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select$$1.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection(subgroups, parents);
};

var selection_filter = function(match) {
  if (typeof match !== "function") match = matcher$1(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection(subgroups, this._parents);
};

var sparse = function(update) {
  return new Array(update.length);
};

var selection_enter = function() {
  return new Selection(this._enter || this._groups.map(sparse), this._parents);
};

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};

var constant = function(x) {
  return function() {
    return x;
  };
};

var keyPrefix = "$"; // Protect against keys like “__proto__”.

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = {},
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = keyPrefix + key.call(node, node.__data__, i, group);
      if (keyValue in nodeByKeyValue) {
        exit[i] = node;
      } else {
        nodeByKeyValue[keyValue] = node;
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = keyPrefix + key.call(parent, data[i], i, data);
    if (node = nodeByKeyValue[keyValue]) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue[keyValue] = null;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue[keyValues[i]] === node)) {
      exit[i] = node;
    }
  }
}

var selection_data = function(value, key) {
  if (!value) {
    data = new Array(this.size()), j = -1;
    this.each(function(d) { data[++j] = d; });
    return data;
  }

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = value.call(parent, parent && parent.__data__, j, parents),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }

  update = new Selection(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
};

var selection_exit = function() {
  return new Selection(this._exit || this._groups.map(sparse), this._parents);
};

var selection_merge = function(selection$$1) {

  for (var groups0 = this._groups, groups1 = selection$$1._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection(merges, this._parents);
};

var selection_order = function() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
};

var selection_sort = function(compare) {
  if (!compare) compare = ascending;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection(sortgroups, this._parents).order();
};

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

var selection_call = function() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
};

var selection_nodes = function() {
  var nodes = new Array(this.size()), i = -1;
  this.each(function() { nodes[++i] = this; });
  return nodes;
};

var selection_node = function() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
};

var selection_size = function() {
  var size = 0;
  this.each(function() { ++size; });
  return size;
};

var selection_empty = function() {
  return !this.node();
};

var selection_each = function(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
};

function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}

function attrFunctionNS(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

var selection_attr = function(name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS : attrFunction)
      : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
};

var defaultView = function(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
};

function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}

var selection_style = function(name, value, priority) {
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove : typeof value === "function"
            ? styleFunction
            : styleConstant)(name, value, priority == null ? "" : priority))
      : styleValue(this.node(), name);
};

function styleValue(node, name) {
  return node.style.getPropertyValue(name)
      || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}

function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}

var selection_property = function(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove : typeof value === "function"
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
};

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}

function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}

function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

var selection_classed = function(name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction : value
      ? classedTrue
      : classedFalse)(names, value));
};

function textRemove() {
  this.textContent = "";
}

function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

var selection_text = function(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove : (typeof value === "function"
          ? textFunction
          : textConstant)(value))
      : this.node().textContent;
};

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

var selection_html = function(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove : (typeof value === "function"
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
};

function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

var selection_raise = function() {
  return this.each(raise);
};

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

var selection_lower = function() {
  return this.each(lower);
};

var selection_append = function(name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
};

function constantNull() {
  return null;
}

var selection_insert = function(name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select$$1 = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select$$1.apply(this, arguments) || null);
  });
};

function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

var selection_remove = function() {
  return this.each(remove);
};

var selection_datum = function(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
};

function dispatchEvent(node, type, params) {
  var window = defaultView(node),
      event$$1 = window.CustomEvent;

  if (typeof event$$1 === "function") {
    event$$1 = new event$$1(type, params);
  } else {
    event$$1 = window.document.createEvent("Event");
    if (params) event$$1.initEvent(type, params.bubbles, params.cancelable), event$$1.detail = params.detail;
    else event$$1.initEvent(type, false, false);
  }

  node.dispatchEvent(event$$1);
}

function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

var selection_dispatch = function(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction
      : dispatchConstant)(type, params));
};

var root = [null];

function Selection(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection([[document.documentElement]], root);
}

Selection.prototype = selection.prototype = {
  constructor: Selection,
  select: selection_select,
  selectAll: selection_selectAll,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  merge: selection_merge,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch
};

var select$1 = function(selector) {
  return typeof selector === "string"
      ? new Selection([[document.querySelector(selector)]], [document.documentElement])
      : new Selection([[selector]], root);
};

var noop = {value: function() {}};

function dispatch$1() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames$1(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch$1.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames$1(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get$1(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$1(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1000;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = typeof performance === "object" && performance.now ? performance : Date;
var setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call =
  this._time =
  this._next = null;
}

Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke() {
  var now = clock.now(), delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout) timeout = clearTimeout(timeout);
  var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
  if (delay > 24) {
    if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

var timeout$1 = function(callback, delay, time) {
  var t = new Timer;
  delay = delay == null ? 0 : +delay;
  t.restart(function(elapsed) {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
};

var emptyOn = dispatch$1("start", "end", "interrupt");
var emptyTween = [];

var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;

var schedule = function(node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};
  else if (id in schedules) return;
  create(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
};

function init(node, id) {
  var schedule = get(node, id);
  if (schedule.state > CREATED) throw new Error("too late; already scheduled");
  return schedule;
}

function set(node, id) {
  var schedule = get(node, id);
  if (schedule.state > STARTING) throw new Error("too late; already started");
  return schedule;
}

function get(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
  return schedule;
}

function create(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED) return timeout$1(start);

      // Interrupt the active transition, if any.
      // Dispatch the interrupt event.
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions. No interrupt event is dispatched
      // because the cancelled transitions never started. Note that this also
      // removes this transition from the pending list!
      else if (+i < id) {
        o.state = ENDED;
        o.timer.stop();
        delete schedules[i];
      }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout$1(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return; // interrupted
    self.state = STARTED;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(null, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) return; // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

var interrupt = function(node, name) {
  var schedules = node.__transition,
      schedule$$1,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule$$1 = schedules[i]).name !== name) { empty = false; continue; }
    active = schedule$$1.state > STARTING && schedule$$1.state < ENDING;
    schedule$$1.state = ENDED;
    schedule$$1.timer.stop();
    if (active) schedule$$1.on.call("interrupt", node, node.__data__, schedule$$1.index, schedule$$1.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
};

var selection_interrupt = function(name) {
  return this.each(function() {
    interrupt(this, name);
  });
};

var define = function(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
};

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*";
var reN = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\s*";
var reP = "\\s*([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
var reHex3 = /^#([0-9a-f]{3})$/;
var reHex6 = /^#([0-9a-f]{6})$/;
var reRgbInteger = new RegExp("^rgb\\(" + [reI, reI, reI] + "\\)$");
var reRgbPercent = new RegExp("^rgb\\(" + [reP, reP, reP] + "\\)$");
var reRgbaInteger = new RegExp("^rgba\\(" + [reI, reI, reI, reN] + "\\)$");
var reRgbaPercent = new RegExp("^rgba\\(" + [reP, reP, reP, reN] + "\\)$");
var reHslPercent = new RegExp("^hsl\\(" + [reN, reP, reP] + "\\)$");
var reHslaPercent = new RegExp("^hsla\\(" + [reN, reP, reP, reN] + "\\)$");

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  displayable: function() {
    return this.rgb().displayable();
  },
  toString: function() {
    return this.rgb() + "";
  }
});

function color(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
      : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format])
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function() {
    return this;
  },
  displayable: function() {
    return (0 <= this.r && this.r <= 255)
        && (0 <= this.g && this.g <= 255)
        && (0 <= this.b && this.b <= 255)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  toString: function() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(")
        + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.b) || 0))
        + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  displayable: function() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

var deg2rad = Math.PI / 180;
var rad2deg = 180 / Math.PI;

var Kn = 18;
var Xn = 0.950470;
var Yn = 1;
var Zn = 1.088830;
var t0 = 4 / 29;
var t1 = 6 / 29;
var t2 = 3 * t1 * t1;
var t3 = t1 * t1 * t1;

function labConvert(o) {
  if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl) {
    var h = o.h * deg2rad;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var b = rgb2xyz(o.r),
      a = rgb2xyz(o.g),
      l = rgb2xyz(o.b),
      x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
      y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
      z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
  return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
}

function Lab(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define(Lab, lab, extend(Color, {
  brighter: function(k) {
    return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function(k) {
    return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn * lab2xyz(y);
    x = Xn * lab2xyz(x);
    z = Zn * lab2xyz(z);
    return new Rgb(
      xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
      xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
      xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
      this.opacity
    );
  }
}));

function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0;
}

function lab2xyz(t) {
  return t > t1 ? t * t * t : t2 * (t - t0);
}

function xyz2rgb(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert(o) {
  if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab)) o = labConvert(o);
  var h = Math.atan2(o.b, o.a) * rad2deg;
  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function hcl(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hcl, hcl, extend(Color, {
  brighter: function(k) {
    return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
  },
  darker: function(k) {
    return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
  },
  rgb: function() {
    return labConvert(this).rgb();
  }
}));

var A = -0.14861;
var B = +1.78277;
var C = -0.29227;
var D = -0.90649;
var E = +1.97294;
var ED = E * D;
var EB = E * B;
var BC_DA = B * C - D * A;

function cubehelixConvert(o) {
  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
      bl = b - l,
      k = (E * (g - l) - C * bl) / D,
      s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
      h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Cubehelix, cubehelix, extend(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb(
      255 * (l + a * (A * cosh + B * sinh)),
      255 * (l + a * (C * cosh + D * sinh)),
      255 * (l + a * (E * cosh)),
      this.opacity
    );
  }
}));

function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0
      + (4 - 6 * t2 + 3 * t3) * v1
      + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
      + t3 * v3) / 6;
}

var constant$1 = function(x) {
  return function() {
    return x;
  };
};

function linear(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function hue(a, b) {
  var d = b - a;
  return d ? linear(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$1(isNaN(a) ? b : a);
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant$1(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant$1(isNaN(a) ? b : a);
}

var interpolateRgb = (function rgbGamma(y) {
  var color$$1 = gamma(y);

  function rgb(start, end) {
    var r = color$$1((start = rgb(start)).r, (end = rgb(end)).r),
        g = color$$1(start.g, end.g),
        b = color$$1(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb.gamma = rgbGamma;

  return rgb;
})(1);

var interpolateNumber = function(a, b) {
  return a = +a, b -= a, function(t) {
    return a + b * t;
  };
};

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");

function zero(b) {
  return function() {
    return b;
  };
}

function one(b) {
  return function(t) {
    return b(t) + "";
  };
}

var interpolateString = function(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: interpolateNumber(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one(q[0].x)
      : zero(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
};

var degrees = 180 / Math.PI;

var identity$1 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

var decompose = function(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
};

var cssNode;
var cssRoot;
var cssView;
var svgNode;

function parseCss(value) {
  if (value === "none") return identity$1;
  if (!cssNode) cssNode = document.createElement("DIV"), cssRoot = document.documentElement, cssView = document.defaultView;
  cssNode.style.transform = value;
  value = cssView.getComputedStyle(cssRoot.appendChild(cssNode), null).getPropertyValue("transform");
  cssRoot.removeChild(cssNode);
  value = value.slice(7, -1).split(",");
  return decompose(+value[0], +value[1], +value[2], +value[3], +value[4], +value[5]);
}

function parseSvg(value) {
  if (value == null) return identity$1;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$1;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function(a, b) {
    var s = [], // string constants and placeholders
        q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}

var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

function cubehelix$1(hue$$1) {
  return (function cubehelixGamma(y) {
    y = +y;

    function cubehelix(start, end) {
      var h = hue$$1((start = cubehelix(start)).h, (end = cubehelix(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix.gamma = cubehelixGamma;

    return cubehelix;
  })(1);
}

cubehelix$1(hue);
var cubehelixLong = cubehelix$1(nogamma);

function tweenRemove(id, name) {
  var tween0, tween1;
  return function() {
    var schedule$$1 = set(this, id),
        tween = schedule$$1.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule$$1.tween = tween1;
  };
}

function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error;
  return function() {
    var schedule$$1 = set(this, id),
        tween = schedule$$1.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule$$1.tween = tween1;
  };
}

var transition_tween = function(name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
};

function tweenValue(transition, name, value) {
  var id = transition._id;

  transition.each(function() {
    var schedule$$1 = set(this, id);
    (schedule$$1.value || (schedule$$1.value = {}))[name] = value.apply(this, arguments);
  });

  return function(node) {
    return get(node, id).value[name];
  };
}

var interpolate = function(a, b) {
  var c;
  return (typeof b === "number" ? interpolateNumber
      : b instanceof color ? interpolateRgb
      : (c = color(b)) ? (b = c, interpolateRgb)
      : interpolateString)(a, b);
};

function attrRemove$1(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$1(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$1(name, interpolate$$1, value1) {
  var value00,
      interpolate0;
  return function() {
    var value0 = this.getAttribute(name);
    return value0 === value1 ? null
        : value0 === value00 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrConstantNS$1(fullname, interpolate$$1, value1) {
  var value00,
      interpolate0;
  return function() {
    var value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null
        : value0 === value00 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function attrFunction$1(name, interpolate$$1, value) {
  var value00,
      value10,
      interpolate0;
  return function() {
    var value0, value1 = value(this);
    if (value1 == null) return void this.removeAttribute(name);
    value0 = this.getAttribute(name);
    return value0 === value1 ? null
        : value0 === value00 && value1 === value10 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

function attrFunctionNS$1(fullname, interpolate$$1, value) {
  var value00,
      value10,
      interpolate0;
  return function() {
    var value0, value1 = value(this);
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    value0 = this.getAttributeNS(fullname.space, fullname.local);
    return value0 === value1 ? null
        : value0 === value00 && value1 === value10 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

var transition_attr = function(name, value) {
  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
  return this.attrTween(name, typeof value === "function"
      ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value))
      : value == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname)
      : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value + ""));
};

function attrTweenNS(fullname, value) {
  function tween() {
    var node = this, i = value.apply(node, arguments);
    return i && function(t) {
      node.setAttributeNS(fullname.space, fullname.local, i(t));
    };
  }
  tween._value = value;
  return tween;
}

function attrTween(name, value) {
  function tween() {
    var node = this, i = value.apply(node, arguments);
    return i && function(t) {
      node.setAttribute(name, i(t));
    };
  }
  tween._value = value;
  return tween;
}

var transition_attrTween = function(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  var fullname = namespace(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
};

function delayFunction(id, value) {
  return function() {
    init(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant(id, value) {
  return value = +value, function() {
    init(this, id).delay = value;
  };
}

var transition_delay = function(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? delayFunction
          : delayConstant)(id, value))
      : get(this.node(), id).delay;
};

function durationFunction(id, value) {
  return function() {
    set(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant(id, value) {
  return value = +value, function() {
    set(this, id).duration = value;
  };
}

var transition_duration = function(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? durationFunction
          : durationConstant)(id, value))
      : get(this.node(), id).duration;
};

function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error;
  return function() {
    set(this, id).ease = value;
  };
}

var transition_ease = function(value) {
  var id = this._id;

  return arguments.length
      ? this.each(easeConstant(id, value))
      : get(this.node(), id).ease;
};

var transition_filter = function(match) {
  if (typeof match !== "function") match = matcher$1(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition(subgroups, this._parents, this._name, this._id);
};

var transition_merge = function(transition$$1) {
  if (transition$$1._id !== this._id) throw new Error;

  for (var groups0 = this._groups, groups1 = transition$$1._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition(merges, this._parents, this._name, this._id);
};

function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction(id, name, listener) {
  var on0, on1, sit = start(name) ? init : set;
  return function() {
    var schedule$$1 = sit(this, id),
        on = schedule$$1.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule$$1.on = on1;
  };
}

var transition_on = function(name, listener) {
  var id = this._id;

  return arguments.length < 2
      ? get(this.node(), id).on.on(name)
      : this.each(onFunction(id, name, listener));
};

function removeFunction(id) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id) return;
    if (parent) parent.removeChild(this);
  };
}

var transition_remove = function() {
  return this.on("end.remove", removeFunction(this._id));
};

var transition_select = function(select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selector(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select$$1.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule(subgroup[i], name, id, i, subgroup, get(node, id));
      }
    }
  }

  return new Transition(subgroups, this._parents, name, id);
};

var transition_selectAll = function(select$$1) {
  var name = this._name,
      id = this._id;

  if (typeof select$$1 !== "function") select$$1 = selectorAll(select$$1);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select$$1.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition(subgroups, parents, name, id);
};

var Selection$1 = selection.prototype.constructor;

var transition_selection = function() {
  return new Selection$1(this._groups, this._parents);
};

function styleRemove$1(name, interpolate$$1) {
  var value00,
      value10,
      interpolate0;
  return function() {
    var value0 = styleValue(this, name),
        value1 = (this.style.removeProperty(name), styleValue(this, name));
    return value0 === value1 ? null
        : value0 === value00 && value1 === value10 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

function styleRemoveEnd(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant$1(name, interpolate$$1, value1) {
  var value00,
      interpolate0;
  return function() {
    var value0 = styleValue(this, name);
    return value0 === value1 ? null
        : value0 === value00 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value1);
  };
}

function styleFunction$1(name, interpolate$$1, value) {
  var value00,
      value10,
      interpolate0;
  return function() {
    var value0 = styleValue(this, name),
        value1 = value(this);
    if (value1 == null) value1 = (this.style.removeProperty(name), styleValue(this, name));
    return value0 === value1 ? null
        : value0 === value00 && value1 === value10 ? interpolate0
        : interpolate0 = interpolate$$1(value00 = value0, value10 = value1);
  };
}

var transition_style = function(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
  return value == null ? this
          .styleTween(name, styleRemove$1(name, i))
          .on("end.style." + name, styleRemoveEnd(name))
      : this.styleTween(name, typeof value === "function"
          ? styleFunction$1(name, i, tweenValue(this, "style." + name, value))
          : styleConstant$1(name, i, value + ""), priority);
};

function styleTween(name, value, priority) {
  function tween() {
    var node = this, i = value.apply(node, arguments);
    return i && function(t) {
      node.style.setProperty(name, i(t), priority);
    };
  }
  tween._value = value;
  return tween;
}

var transition_styleTween = function(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
};

function textConstant$1(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction$1(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

var transition_text = function(value) {
  return this.tween("text", typeof value === "function"
      ? textFunction$1(tweenValue(this, "text", value))
      : textConstant$1(value == null ? "" : value + ""));
};

var transition_transition = function() {
  var name = this._name,
      id0 = this._id,
      id1 = newId();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get(node, id0);
        schedule(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition(groups, this._parents, name, id1);
};

var id = 0;

function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function transition(name) {
  return selection().transition(name);
}

function newId() {
  return ++id;
}

var selection_prototype = selection.prototype;

Transition.prototype = transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease
};

function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var exponent = 3;

var polyIn = (function custom(e) {
  e = +e;

  function polyIn(t) {
    return Math.pow(t, e);
  }

  polyIn.exponent = custom;

  return polyIn;
})(exponent);

var polyOut = (function custom(e) {
  e = +e;

  function polyOut(t) {
    return 1 - Math.pow(1 - t, e);
  }

  polyOut.exponent = custom;

  return polyOut;
})(exponent);

var polyInOut = (function custom(e) {
  e = +e;

  function polyInOut(t) {
    return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
  }

  polyInOut.exponent = custom;

  return polyInOut;
})(exponent);

var overshoot = 1.70158;

var backIn = (function custom(s) {
  s = +s;

  function backIn(t) {
    return t * t * ((s + 1) * t - s);
  }

  backIn.overshoot = custom;

  return backIn;
})(overshoot);

var backOut = (function custom(s) {
  s = +s;

  function backOut(t) {
    return --t * t * ((s + 1) * t + s) + 1;
  }

  backOut.overshoot = custom;

  return backOut;
})(overshoot);

var backInOut = (function custom(s) {
  s = +s;

  function backInOut(t) {
    return ((t *= 2) < 1 ? t * t * ((s + 1) * t - s) : (t -= 2) * t * ((s + 1) * t + s) + 2) / 2;
  }

  backInOut.overshoot = custom;

  return backInOut;
})(overshoot);

var tau = 2 * Math.PI;
var amplitude = 1;
var period = 0.3;

var elasticIn = (function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticIn(t) {
    return a * Math.pow(2, 10 * --t) * Math.sin((s - t) / p);
  }

  elasticIn.amplitude = function(a) { return custom(a, p * tau); };
  elasticIn.period = function(p) { return custom(a, p); };

  return elasticIn;
})(amplitude, period);

var elasticOut = (function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticOut(t) {
    return 1 - a * Math.pow(2, -10 * (t = +t)) * Math.sin((t + s) / p);
  }

  elasticOut.amplitude = function(a) { return custom(a, p * tau); };
  elasticOut.period = function(p) { return custom(a, p); };

  return elasticOut;
})(amplitude, period);

var elasticInOut = (function custom(a, p) {
  var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

  function elasticInOut(t) {
    return ((t = t * 2 - 1) < 0
        ? a * Math.pow(2, 10 * t) * Math.sin((s - t) / p)
        : 2 - a * Math.pow(2, -10 * t) * Math.sin((s + t) / p)) / 2;
  }

  elasticInOut.amplitude = function(a) { return custom(a, p * tau); };
  elasticInOut.period = function(p) { return custom(a, p); };

  return elasticInOut;
})(amplitude, period);

var defaultTiming = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};

function inherit(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      return defaultTiming.time = now(), defaultTiming;
    }
  }
  return timing;
}

var selection_transition = function(name) {
  var id,
      timing;

  if (name instanceof Transition) {
    id = name._id, name = name._name;
  } else {
    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule(node, name, id, i, group, timing || inherit(node, id));
      }
    }
  }

  return new Transition(groups, this._parents, name, id);
};

selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;

function attrsFunction(selection, map) {
  return selection.each(function() {
    var x = map.apply(this, arguments), s = select$1(this);
    for (var name in x) s.attr(name, x[name]);
  });
}

function attrsObject(selection, map) {
  for (var name in map) selection.attr(name, map[name]);
  return selection;
}

var selection_attrs = function(map) {
  return (typeof map === "function" ? attrsFunction : attrsObject)(this, map);
};

function stylesFunction(selection, map, priority) {
  return selection.each(function() {
    var x = map.apply(this, arguments), s = select$1(this);
    for (var name in x) s.style(name, x[name], priority);
  });
}

function stylesObject(selection, map, priority) {
  for (var name in map) selection.style(name, map[name], priority);
  return selection;
}

var selection_styles = function(map, priority) {
  return (typeof map === "function" ? stylesFunction : stylesObject)(this, map, priority == null ? "" : priority);
};

function propertiesFunction(selection, map) {
  return selection.each(function() {
    var x = map.apply(this, arguments), s = select$1(this);
    for (var name in x) s.property(name, x[name]);
  });
}

function propertiesObject(selection, map) {
  for (var name in map) selection.property(name, map[name]);
  return selection;
}

var selection_properties = function(map) {
  return (typeof map === "function" ? propertiesFunction : propertiesObject)(this, map);
};

selection.prototype.attrs = selection_attrs;
selection.prototype.styles = selection_styles;
selection.prototype.properties = selection_properties;

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
    fn = createGroupedPlane(opts);
    con = dataArea.append('g').attr('class', 'planes');
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
    // Add dragging for debug purposes
    //drag = d3.drag()
    //.on 'drag', =>
    //proj.rotate [d3.event.x, -d3.event.y]
    //dispatch.call 'rotate', f
    //__redraw()
    //el.call drag
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

/**
 * Test whether a value is a BigNumber
 * @param {*} x
 * @return {boolean}
 */
var isBigNumber = function isBigNumber(x) {
  return x && x.constructor.prototype.isBigNumber || false
};

var object$1 = createCommonjsModule(function (module, exports) {
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
var create$3 = function create(type) {
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
	create: create$3
};

function E$1 () {
  // Keep this empty so it's easier to inherit from
  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
}

E$1.prototype = {
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

var tinyEmitter = E$1;

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

var lazy = object$1.lazy;
var isFactory$1 = object$1.isFactory;
var traverse = object$1.traverse;


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
  function math_import(object, options) {
    var num = arguments.length;
    if (num !== 1 && num !== 2) {
      throw new ArgumentsError_1('import', num, 1, 2);
    }

    if (!options) {
      options = {};
    }

    if (isFactory$1(object)) {
      _importFactory(object, options);
    }
    // TODO: allow a typed-function with name too
    else if (Array.isArray(object)) {
      object.forEach(function (entry) {
        math_import(entry, options);
      });
    }
    else if (typeof object === 'object') {
      // a map with functions
      for (var name in object) {
        if (object.hasOwnProperty(name)) {
          var value = object[name];
          if (isSupportedType(value)) {
            _import(name, value, options);
          }
          else if (isFactory$1(object)) {
            _importFactory(object, options);
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
  function isSupportedType(object) {
    return typeof object === 'function'
        || typeof object === 'number'
        || typeof object === 'string'
        || typeof object === 'boolean'
        || object === null
        || (object && type.isUnit(object))
        || (object && type.isComplex(object))
        || (object && type.isBigNumber(object))
        || (object && type.isFraction(object))
        || (object && type.isMatrix(object))
        || (object && Array.isArray(object))
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
      var prev = object$1.map(config, object$1.clone);

      // validate some of the options
      validateOption(options, 'matrix', MATRIX);
      validateOption(options, 'number', NUMBER);

      // merge options
      object$1.deepExtend(config, options);

      var curr = object$1.map(config, object$1.clone);

      var changes = object$1.map(options, object$1.clone);

      // emit 'config' event
      math.emit('config', curr, prev, changes);

      return curr;
    }
    else {
      return object$1.map(config, object$1.clone);
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

var isFactory = object$1.isFactory;






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
var create$2 = function create (options) {
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
	create: create$2
};

var core$1 = core$2;

var quaternion = createCommonjsModule(function (module, exports) {
/**
 * @license Quaternion.js v2.0.0 22/02/2016
 *
 * Copyright (c) 2016, Robert Eisele (robert@xarg.org)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 **/
(function(root) {

  'use strict';

  /**
   * Calculates log(sqrt(a^2+b^2)) in a way to avoid overflows
   *
   * @param {number} a
   * @param {number} b
   * @returns {number}
   */
  function logHypot(a, b) {

    var _a = Math.abs(a);
    var _b = Math.abs(b);

    if (a === 0) {
      return Math.log(_b);
    }

    if (b === 0) {
      return Math.log(_a);
    }

    if (_a < 3000 && _b < 3000) {
      return Math.log(a * a + b * b) * 0.5;
    }

    return Math.log(a / Math.cos(Math.atan2(b, a)));
  }

  /*
   * Default is the multiplicative one element
   *
   */
  var P = {
    'w': 1,
    'x': 0,
    'y': 0,
    'z': 0
  };

  function parse(dest, w, x, y, z) {

    // Most common internal use case with 4 params
    if (z !== undefined) {
      dest['w'] = w;
      dest['x'] = x;
      dest['y'] = y;
      dest['z'] = z;
      return;
    }

    if (typeof w === 'object' && y === undefined) {

      // Check for quats, for example when an object gets cloned
      if ('w' in w || 'x' in w || 'y' in w || 'z' in w) {
        dest['w'] = w['w'] || 0;
        dest['x'] = w['x'] || 0;
        dest['y'] = w['y'] || 0;
        dest['z'] = w['z'] || 0;
        return;
      }

      // Check for complex numbers
      if ('re' in w && 'im' in w) {
        dest['w'] = w['re'];
        dest['x'] = w['im'];
        dest['y'] = 0;
        dest['z'] = 0;
        return;
      }

      // Check for array
      if (w.length === 4) {
        dest['w'] = w[0];
        dest['x'] = w[1];
        dest['y'] = w[2];
        dest['z'] = w[3];
        return;
      }

      // Check for augmented vector
      if (w.length === 3) {
        dest['w'] = 0;
        dest['x'] = w[0];
        dest['y'] = w[1];
        dest['z'] = w[2];
        return;
      }

      throw new Error('Invalid object');
    }

    // Parse string values
    if (typeof w === 'string' && y === undefined) {

      var tokens = w.match(/\d+\.?\d*e[+-]?\d+|\d+\.?\d*|\.\d+|./g);
      var plus = 1;
      var minus = 0;

      var iMap = {'i': 'x', 'j': 'y', 'k': 'z'};

      if (tokens === null) {
        throw new Error('Parse error');
      }

      // Reset the current state
      dest['w'] =
      dest['x'] =
      dest['y'] =
      dest['z'] = 0;

      for (var i = 0; i < tokens.length; i++) {

        var c = tokens[i];
        var d = tokens[i + 1];

        if (c === ' ' || c === '\t' || c === '\n') {
          /* void */
        } else if (c === '+') {
          plus++;
        } else if (c === '-') {
          minus++;
        } else {

          if (plus + minus === 0) {
            throw new Error('Parse error' + c);
          }
          var g = iMap[c];

          // Is the current token an imaginary sign?
          if (g !== undefined) {

            // Is the following token a number?
            if (d !== ' ' && !isNaN(d)) {
              c = d;
              i++;
            } else {
              c = '1';
            }

          } else {

            if (isNaN(c)) {
              throw new Error('Parser error');
            }

            g = iMap[d];

            if (g !== undefined) {
              i++;
            }
          }

          dest[g || 'w'] += parseFloat((minus % 2 ? '-' : '') + c);
          plus = minus = 0;
        }
      }

      // Still something on the stack
      if (plus + minus > 0) {
        throw new Error('Parser error');
      }
      return;
    }

    // If no single variable was given AND it was the constructor, set it to the identity
    if (w === undefined && dest !== P) {
      dest['w'] = 1;
      dest['x'] =
        dest['y'] =
          dest['z'] = 0;
    } else {

      dest['w'] = w || 0;

      // Note: This isn't setFromAxis, it's just syntactic sugar!
      if (x && x.length === 3) {
        dest['x'] = x[0];
        dest['y'] = x[1];
        dest['z'] = x[2];
      } else {
        dest['x'] = x || 0;
        dest['y'] = y || 0;
        dest['z'] = z || 0;
      }
    }
  }

  function numToStr(n, char, prev) {

    var ret = '';

    if (n !== 0) {

      if (prev !== '') {
        ret += n < 0 ? ' - ' : ' + ';
      } else if (n < 0) {
        ret += '-';
      }

      n = Math.abs(n);

      if (1 !== n || char === '') {
        ret += n;
      }
      ret += char;
    }
    return ret;
  }

  /**
   * Quaternion constructor
   *
   * @constructor
   * @param {number|Object|string} w real
   * @param {number=} x imag
   * @param {number=} y imag
   * @param {number=} z imag
   * @returns {Quaternion}
   */
  function Quaternion(w, x, y, z) {

    if (!(this instanceof Quaternion)) {
      return new Quaternion(w, x, y, z);
    }

    parse(this, w, x, y, z);
  }

  Quaternion.prototype = {
    'w': 1,
    'x': 0,
    'y': 0,
    'z': 0,
    /**
     * Adds two quaternions Q1 and Q2
     *
     * @param {number|Object|string} w real
     * @param {number=} x imag
     * @param {number=} y imag
     * @param {number=} z imag
     * @returns {Quaternion}
     */
    'add': function(w, x, y, z) {

      parse(P, w, x, y, z);

      // Q1 + Q2 := [w1, v1] + [w2, v2] = [w1 + w2, v1 + v2]

      return new Quaternion(
        this['w'] + P['w'],
        this['x'] + P['x'],
        this['y'] + P['y'],
        this['z'] + P['z']);
    },
    /**
     * Subtracts a quaternions Q2 from Q1
     *
     * @param {number|Object|string} w real
     * @param {number=} x imag
     * @param {number=} y imag
     * @param {number=} z imag
     * @returns {Quaternion}
     */
    'sub': function(w, x, y, z) {

      parse(P, w, x, y, z);

      // Q1 - Q2 := Q1 + (-Q2)
      //          = [w1, v1] - [w2, v2] = [w1 - w2, v1 - v2]

      return new Quaternion(
        this['w'] - P['w'],
        this['x'] - P['x'],
        this['y'] - P['y'],
        this['z'] - P['z']);
    },
    /**
     * Calculates the additive inverse, or simply it negates the quaternion
     *
     * @returns {Quaternion}
     */
    'neg': function() {

      // -Q := [-w, -v]

      return new Quaternion(-this['w'], -this['x'], -this['y'], -this['z']);
    },
    /**
     * Calculates the length/modulus/magnitude or the norm of a quaternion
     *
     * @returns {number}
     */
    'norm': function() {

      // |Q| := sqrt(|Q|^2)

      // The unit quaternion has |Q| = 1

      var w = this['w'];
      var x = this['x'];
      var y = this['y'];
      var z = this['z'];

      return Math.sqrt(w * w + x * x + y * y + z * z);
    },
    /**
     * Calculates the squared length/modulus/magnitude or the norm of a quaternion
     *
     * @returns {number}
     */
    'normSq': function() {

      // |Q|^2 := [w, v] * [w, -v]
      //        = [w^2 + dot(v, v), -w * v + w * v + cross(v, -v)]
      //        = [w^2 + |v|^2, 0]
      //        = [w^2 + dot(v, v), 0]
      //        = dot(Q, Q)
      //        = Q * Q'

      var w = this['w'];
      var x = this['x'];
      var y = this['y'];
      var z = this['z'];

      return w * w + x * x + y * y + z * z;
    },
    /**
     * Normalizes the quaternion to have |Q| = 1 as long as the norm is not zero
     * Alternative names are the signum, unit or versor
     *
     * @returns {Quaternion}
     */
    'normalize': function() {

      // Q* := Q / |Q|

      // unrolled Q.scale(1 / Q.norm())

      var w = this['w'];
      var x = this['x'];
      var y = this['y'];
      var z = this['z'];

      var norm = Math.sqrt(w * w + x * x + y * y + z * z);

      if (norm < Quaternion['EPSILON']) {
        return Quaternion['ZERO'];
      }

      norm = 1 / norm;

      return new Quaternion(w * norm, x * norm, y * norm, z * norm);
    },
    /**
     * Calculates the Hamilton product of two quaternions
     * Leaving out the imaginary part results in just scaling the quat
     *
     * @param {number|Object|string} w real
     * @param {number=} x imag
     * @param {number=} y imag
     * @param {number=} z imag
     * @returns {Quaternion}
     */
    'mul': function(w, x, y, z) {

      parse(P, w, x, y, z);

      // Q1 * Q2 = [w1 * w2 - dot(v1, v2), w1 * v2 + w2 * v1 + cross(v1, v2)]

      // Not commutative because cross(v1, v2) != cross(v2, v1)!

      var w1 = this['w'];
      var x1 = this['x'];
      var y1 = this['y'];
      var z1 = this['z'];

      var w2 = P['w'];
      var x2 = P['x'];
      var y2 = P['y'];
      var z2 = P['z'];

      return new Quaternion(
        w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
        w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
        w1 * y2 + y1 * w2 + z1 * x2 - x1 * z2,
        w1 * z2 + z1 * w2 + x1 * y2 - y1 * x2);
    },
    /**
     * Scales a quaternion by a scalar, faster than using multiplication
     *
     * @param {number} s scaling factor
     * @returns {Quaternion}
     */
    'scale': function(s) {

      return new Quaternion(
        this['w'] * s,
        this['x'] * s,
        this['y'] * s,
        this['z'] * s);
    },
    /**
     * Calculates the dot product of two quaternions
     *
     * @param {number|Object|string} w real
     * @param {number=} x imag
     * @param {number=} y imag
     * @param {number=} z imag
     * @returns {number}
     */
    'dot': function(w, x, y, z) {

      parse(P, w, x, y, z);

      // dot(Q1, Q2) := w1 * w2 + dot(v1, v2)

      return this['w'] * P['w'] + this['x'] * P['x'] + this['y'] * P['y'] + this['z'] * P['z'];
    },
    /**
     * Calculates the inverse of a quat for non-normalized quats such that
     * Q^-1 * Q = 1 and Q * Q^-1 = 1
     *
     * @returns {Quaternion}
     */
    'inverse': function() {

      // Q^-1 := Q' / |Q|^2
      //       = [w / (w^2 + |v|^2), -v / (w^2 + |v|^2)]

      // Proof:
      // Q * Q^-1 = [w, v] * [w / (w^2 + |v|^2), -v / (w^2 + |v|^2)]
      //          = [1, 0]
      // Q^-1 * Q = [w / (w^2 + |v|^2), -v / (w^2 + |v|^2)] * [w, v]
      //          = [1, 0].

      var w = this['w'];
      var x = this['x'];
      var y = this['y'];
      var z = this['z'];

      var normSq = w * w + x * x + y * y + z * z;

      if (normSq === 0) {
        return Quaternion['ZERO']; // TODO: Is the result zero or one when the norm is zero?
      }

      normSq = 1 / normSq;

      return new Quaternion(w * normSq, -x * normSq, -y * normSq, -z * normSq);
    },
    /**
     * Multiplies a quaternion with the inverse of a second quaternion
     *
     * @param {number|Object|string} w real
     * @param {number=} x imag
     * @param {number=} y imag
     * @param {number=} z imag
     * @returns {Quaternion}
     */
    'div': function(w, x, y, z) {

      parse(P, w, x, y, z);

      // Q1 / Q2 := Q1 * Q2^-1

      var w1 = this['w'];
      var x1 = this['x'];
      var y1 = this['y'];
      var z1 = this['z'];

      var w2 = P['w'];
      var x2 = P['x'];
      var y2 = P['y'];
      var z2 = P['z'];

      var normSq = w2 * w2 + x2 * x2 + y2 * y2 + z2 * z2;

      if (normSq === 0) {
        return Quaternion['ZERO']; // TODO: Is the result zero or one when the norm is zero?
      }

      normSq = 1 / normSq;

      return new Quaternion(
        (w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2) * normSq,
        (x1 * w2 - w1 * x2 - y1 * z2 + z1 * y2) * normSq,
        (y1 * w2 - w1 * y2 - z1 * x2 + x1 * z2) * normSq,
        (z1 * w2 - w1 * z2 - x1 * y2 + y1 * x2) * normSq);
    },
    /**
     * Calculates the conjugate of a quaternion
     *
     * @returns {Quaternion}
     */
    'conjugate': function() {

      // Q' = [s, -v]

      // If the quaternion is normalized,
      // the conjugate is the inverse of the quaternion - but faster
      // Q' * Q = Q * Q' = 1

      // Additionally, the conjugate of a unit quaternion is a rotation with the same
      // angle but the opposite axis.

      // Moreover the following property holds:
      // (Q1 * Q2)' = Q2' * Q1'

      return new Quaternion(this['w'], -this['x'], -this['y'], -this['z']);
    },
    /**
     * Calculates the natural exponentiation of the quaternion
     *
     * @returns {Quaternion}
     */
    'exp': function() {

      var w = this['w'];
      var x = this['x'];
      var y = this['y'];
      var z = this['z'];

      var vNorm = Math.sqrt(x * x + y * y + z * z);
      var wExp = Math.exp(w);
      var scale = wExp / vNorm * Math.sin(vNorm);

      if (vNorm === 0) {
        //return new Quaternion(wExp * Math.cos(vNorm), 0, 0, 0);
        return new Quaternion(wExp, 0, 0, 0);
      }

      return new Quaternion(
        wExp * Math.cos(vNorm),
        x * scale,
        y * scale,
        z * scale);
    },
    /**
     * Calculates the natural logarithm of the quaternion
     *
     * @returns {Quaternion}
     */
    'log': function() {

      var w = this['w'];
      var x = this['x'];
      var y = this['y'];
      var z = this['z'];

      if (y === 0 && z === 0) {
        return new Quaternion(
          logHypot(w, x),
          Math.atan2(x, w), 0, 0);
      }

      var qNorm2 = x * x + y * y + z * z + w * w;
      var vNorm = Math.sqrt(x * x + y * y + z * z);

      var scale = Math.atan2(vNorm, w) / vNorm;

      return new Quaternion(
        Math.log(qNorm2) * 0.5,
        x * scale,
        y * scale,
        z * scale);
    },
    /**
     * Calculates the power of a quaternion raised to a real number or another quaternion
     *
     * @param {number|Object|string} w real
     * @param {number=} x imag
     * @param {number=} y imag
     * @param {number=} z imag
     * @returns {Quaternion}
     */
    'pow': function(w, x, y, z) {

      parse(P, w, x, y, z);

      if (P['y'] === 0 && P['z'] === 0) {

        if (P['w'] === 1 && P['x'] === 0) {
          return this;
        }

        if (P['w'] === 0 && P['x'] === 0) {
          return Quaternion['ONE'];
        }

        // Check if we can operate in C
        // Borrowed from complex.js
        if (this['y'] === 0 && this['z'] === 0) {

          var a = this['w'];
          var b = this['x'];

          if (a === 0 && b === 0) {
            return Quaternion['ZERO'];
          }

          var arg = Math.atan2(b, a);
          var loh = logHypot(a, b);

          if (P['x'] === 0) {

            if (b === 0 && a >= 0) {

              return new Quaternion(Math.pow(a, P['w']), 0, 0, 0);

            } else if (a === 0) {

              switch (P['w'] % 4) {
                case 0:
                  return new Quaternion(Math.pow(b, P['w']), 0, 0, 0);
                case 1:
                  return new Quaternion(0, Math.pow(b, P['w']), 0, 0);
                case 2:
                  return new Quaternion(-Math.pow(b, P['w']), 0, 0, 0);
                case 3:
                  return new Quaternion(0, -Math.pow(b, P['w']), 0, 0);
              }
            }
          }

          a = Math.exp(P['w'] * loh - P['x'] * arg);
          b = P['x'] * loh + P['w'] * arg;
          return new Quaternion(
            a * Math.cos(b),
            a * Math.sin(b), 0, 0);
        }
      }

      // Normal quaternion behavior
      // q^p = e^ln(q^p) = e^(ln(q)*p)
      return this.log().mul(P).exp();
    },
    /**
     * Checks if two quats are the same
     *
     * @param {number|Object|string} w real
     * @param {number=} x imag
     * @param {number=} y imag
     * @param {number=} z imag
     * @returns {boolean}
     */
    'equals': function(w, x, y, z) {

      parse(P, w, x, y, z);

      var eps = Quaternion['EPSILON'];

      // maybe check for NaN's here?
      return Math.abs(P['w'] - this['w']) < eps
        && Math.abs(P['x'] - this['x']) < eps
        && Math.abs(P['y'] - this['y']) < eps
        && Math.abs(P['z'] - this['z']) < eps;
    },
    /**
     * Checks if all parts of a quaternion are finite
     *
     * @returns {boolean}
     */
    'isFinite': function() {

      return isFinite(this['w']) && isFinite(this['x']) && isFinite(this['y']) && isFinite(this['z']);
    },
    /**
     * Checks if any of the parts of the quaternion is not a number
     *
     * @returns {boolean}
     */
    'isNaN': function() {

      return isNaN(this['w']) || isNaN(this['x']) || isNaN(this['y']) || isNaN(this['z']);
    },
    /**
     * Gets the Quaternion as a well formatted string
     *
     * @returns {string}
     */
    'toString': function() {

      var w = this['w'];
      var x = this['x'];
      var y = this['y'];
      var z = this['z'];
      var ret = '';

      if (isNaN(w) || isNaN(x) || isNaN(y) || isNaN(z)) {
        return 'NaN';
      }

      // Alternative design?
      // '(%f, [%f %f %f])'

      ret = numToStr(w, '', ret);
      ret += numToStr(x, 'i', ret);
      ret += numToStr(y, 'j', ret);
      ret += numToStr(z, 'k', ret);

      if ('' === ret)
        return '0';

      return ret;
    },
    /**
     * Returns the real part of the quaternion
     *
     * @returns {number}
     */
    'real': function() {

      return this['w'];
    },
    /**
     * Returns the imaginary part of the quaternion as a 3D vector / array
     *
     * @returns {Quaternion}
     */
    'imag': function() {

      return [this['x'], this['y'], this['z']];
    },
    /**
     * Gets the actual quaternion as a 4D vector / array
     *
     * @returns {Array}
     */
    'toVector': function() {

      return [this['w'], this['x'], this['y'], this['z']];
    },
    /**
     * Calculates the 3x3 rotation matrix for the current quat
     *
     * @param {boolean=} d2
     * @see https://en.wikipedia.org/wiki/Rotation_matrix#Quaternion
     * @returns {Array}
     */
    'toMatrix': function(d2) {

      var w = this['w'];
      var x = this['x'];
      var y = this['y'];
      var z = this['z'];

      var n = w * w + x * x + y * y + z * z;
      var s = n === 0 ? 0 : 2 / n;
      var wx = s * w * x, wy = s * w * y, wz = s * w * z;
      var xx = s * x * x, xy = s * x * y, xz = s * x * z;
      var yy = s * y * y, yz = s * y * z, zz = s * z * z;

      if (d2) {
        return [
          [1 - (yy + zz), xy - wz, xz + wy],
          [xy + wz, 1 - (xx + zz), yz - wx],
          [xz - wy, yz + wx, 1 - (xx + yy)]];
      }

      return [
        1 - (yy + zz), xy - wz, xz + wy,
        xy + wz, 1 - (xx + zz), yz - wx,
        xz - wy, yz + wx, 1 - (xx + yy)];
    },
    /**
     * Calculates the homogeneous 4x4 rotation matrix for the current quat
     *
     * @param {boolean=} d2
     * @returns {Array}
     */
    'toMatrix4': function(d2) {

      var w = this['w'];
      var x = this['x'];
      var y = this['y'];
      var z = this['z'];

      var n = w * w + x * x + y * y + z * z;
      var s = n === 0 ? 0 : 2 / n;
      var wx = s * w * x, wy = s * w * y, wz = s * w * z;
      var xx = s * x * x, xy = s * x * y, xz = s * x * z;
      var yy = s * y * y, yz = s * y * z, zz = s * z * z;

      if (d2) {
        return [
          [1 - (yy + zz), xy - wz, xz + wy, 0],
          [xy + wz, 1 - (xx + zz), yz - wx, 0],
          [xz - wy, yz + wx, 1 - (xx + yy), 0],
          [0, 0, 0, 1]];
      }

      return [
        1 - (yy + zz), xy - wz, xz + wy, 0,
        xy + wz, 1 - (xx + zz), yz - wx, 0,
        xz - wy, yz + wx, 1 - (xx + yy), 0,
        0, 0, 0, 1];
    },
    /**
     * Clones the actual object
     *
     * @returns {Quaternion}
     */
    'clone': function() {

      return new Quaternion(this);
    },
    /**
     * Rotates a vector according to the current quaternion
     *
     * @param {Array} v The vector to be rotated
     * @returns {Array}
     */
    'rotateVector': function(v) {

      // [0, v'] = Q * [0, v] * Q'

      // Q
      var w1 = this['w'];
      var x1 = this['x'];
      var y1 = this['y'];
      var z1 = this['z'];

      // [0, v]
      var w2 = 0;
      var x2 = v[0];
      var y2 = v[1];
      var z2 = v[2];

      // Q * [0, v]
      var w3 = /*w1 * w2*/ -x1 * x2 - y1 * y2 - z1 * z2;
      var x3 = w1 * x2 + /*x1 * w2 +*/ y1 * z2 - z1 * y2;
      var y3 = w1 * y2 + /*y1 * w2 +*/ z1 * x2 - x1 * z2;
      var z3 = w1 * z2 + /*z1 * w2 +*/ x1 * y2 - y1 * x2;

      var w4 = w3 * w1 + x3 * x1 + y3 * y1 + z3 * z1;
      var x4 = x3 * w1 - w3 * x1 - y3 * z1 + z3 * y1;
      var y4 = y3 * w1 - w3 * y1 - z3 * x1 + x3 * z1;
      var z4 = z3 * w1 - w3 * z1 - x3 * y1 + y3 * x1;

      return [x4, y4, z4];
    }
  };

  Quaternion['ZERO'] = new Quaternion(0, 0, 0, 0); // This is the additive identity Quaternion
  Quaternion['ONE'] = new Quaternion(1, 0, 0, 0); // This is the multiplicative identity Quaternion
  Quaternion['I'] = new Quaternion(0, 1, 0, 0);
  Quaternion['J'] = new Quaternion(0, 0, 1, 0);
  Quaternion['K'] = new Quaternion(0, 0, 0, 1);
  Quaternion['EPSILON'] = 1e-16;

  /**
   * Creates quaternion by a rotation given as axis and angle
   *
   * @param {Array} axis The axis around which to rotate
   * @param {number} angle The angle in radians
   * @returns {Quaternion}
   */
  Quaternion['fromAxisAngle'] = function(axis, angle) {

    // Q = [cos(angle / 2), v * sin(angle / 2)]

    var halfAngle = angle * 0.5;

    var a = axis[0];
    var b = axis[1];
    var c = axis[2];

    var sin = Math.sin(halfAngle);
    var cos = Math.cos(halfAngle);

    var sin_norm = sin / Math.sqrt(a * a + b * b + c * c);

    return new Quaternion(cos, a * sin_norm, b * sin_norm, c * sin_norm);
  };

  /**
   * Calculates the quaternion to rotate one vector onto the other
   *
   * @param {Array} u
   * @param {Array} v
   */
  Quaternion['fromBetweenVectors'] = function(u, v) {

    var a = u[0];
    var b = u[1];
    var c = u[2];

    var x = v[0];
    var y = v[1];
    var z = v[2];

    var dot = a * x + b * y + c * z;
    var w1 = b * z - c * y;
    var w2 = c * x - a * z;
    var w3 = a * y - b * x;

    return new Quaternion(
      dot + Math.sqrt(dot * dot + w1 * w1 + w2 * w2 + w3 * w3),
      w1,
      w2,
      w3
    ).normalize();
  };

  /**
   * Creates a quaternion by a rotation given by Euler angles
   *
   * @param {number} phi
   * @param {number} theta
   * @param {number} psi
   * @param {string=} order
   * @returns {Quaternion}
   */
  Quaternion['fromEuler'] = function(phi, theta, psi, order) {

    var _x = theta * 0.5;
    var _y = psi * 0.5;
    var _z = phi * 0.5;

    var cX = Math.cos(_x);
    var cY = Math.cos(_y);
    var cZ = Math.cos(_z);

    var sX = Math.sin(_x);
    var sY = Math.sin(_y);
    var sZ = Math.sin(_z);

    if (order === undefined || order === 'ZXY') {
      return new Quaternion(
        cX * cY * cZ - sX * sY * sZ,
        sX * cY * cZ - cX * sY * sZ,
        cX * sY * cZ + sX * cY * sZ,
        cX * cY * sZ + sX * sY * cZ);
    }

    if (order === 'XYZ') {
      return new Quaternion(
        cX * cY * cZ - sX * sY * sZ,
        sX * cY * cZ + cX * sY * sZ,
        cX * sY * cZ - sX * cY * sZ,
        cX * cY * sZ + sX * sY * cZ);
    }

    if (order === 'YXZ') {
      return new Quaternion(
        cX * cY * cZ + sX * sY * sZ,
        sX * cY * cZ + cX * sY * sZ,
        cX * sY * cZ - sX * cY * sZ,
        cX * cY * sZ - sX * sY * cZ);
    }

    if (order === 'ZYX') {
      return new Quaternion(
        cX * cY * cZ + sX * sY * sZ,
        sX * cY * cZ - cX * sY * sZ,
        cX * sY * cZ + sX * cY * sZ,
        cX * cY * sZ - sX * sY * cZ);
    }

    if (order === 'YZX') {
      return new Quaternion(
        cX * cY * cZ - sX * sY * sZ,
        sX * cY * cZ + cX * sY * sZ,
        cX * sY * cZ + sX * cY * sZ,
        cX * cY * sZ - sX * sY * cZ);
    }

    if (order === 'XZY') {
      return new Quaternion(
        cX * cY * cZ + sX * sY * sZ,
        sX * cY * cZ - cX * sY * sZ,
        cX * sY * cZ - sX * cY * sZ,
        cX * cY * sZ + sX * sY * cZ);
    }
    return null;
  };

  if (typeof undefined === 'function' && undefined['amd']) {
    undefined([], function() {
      return Quaternion;
    });
  } else {
    module['exports'] = Quaternion;
  }

})(commonjsGlobal);
});

var jsUuid = createCommonjsModule(function (module) {
// Written by Robert Kieffer – https://github.com/broofa/node-uuid
// MIT License - http://opensource.org/licenses/mit-license.php
// The wrapped node-uuid library is at version 1.4.7

function UUID () {
  'use strict';

  // Unique ID creation requires a high quality random # generator.  We feature
  // detect to determine the best RNG source, normalizing to a function that
  // returns 128-bits of randomness, since that's what's usually required
  var _rng, _mathRNG, _whatwgRNG;

  // Allow for MSIE11 msCrypto
  var _crypto = window.crypto || window.msCrypto;

  if (!_rng && _crypto && _crypto.getRandomValues) {
    // WHATWG crypto-based RNG - http://wiki.whatwg.org/wiki/Crypto
    //
    // Moderately fast, high quality
    try {
      var _rnds8 = new Uint8Array(16);
      _whatwgRNG = _rng = function whatwgRNG() {
        _crypto.getRandomValues(_rnds8);
        return _rnds8;
      };
      _rng();
    } catch(e) {}
  }

  if (!_rng) {
    // Math.random()-based (RNG)
    //
    // If all else fails, use Math.random().  It's fast, but is of unspecified
    // quality.
    var  _rnds = new Array(16);
    _mathRNG = _rng = function() {
      for (var i = 0, r; i < 16; i++) {
        if ((i & 0x03) === 0) { r = Math.random() * 0x100000000; }
        _rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
      }

      return _rnds;
    };
    if ('undefined' !== typeof console && console.warn) {
      console.warn('[SECURITY] node-uuid: crypto not usable, falling back to insecure Math.random()');
    }
  }

  // Buffer class to use
  var BufferClass = ('function' === typeof Buffer) ? Buffer : Array;

  // Maps for number <-> hex string conversion
  var _byteToHex = [];
  var _hexToByte = {};
  for (var i = 0; i < 256; i++) {
    _byteToHex[i] = (i + 0x100).toString(16).substr(1);
    _hexToByte[_byteToHex[i]] = i;
  }

  // **`parse()` - Parse a UUID into it's component bytes**
  function parse(s, buf, offset) {
    var i = (buf && offset) || 0, ii = 0;

    buf = buf || [];
    s.toLowerCase().replace(/[0-9a-f]{2}/g, function(oct) {
      if (ii < 16) { // Don't overflow!
        buf[i + ii++] = _hexToByte[oct];
      }
    });

    // Zero out remaining bytes if string was short
    while (ii < 16) {
      buf[i + ii++] = 0;
    }

    return buf;
  }

  // **`unparse()` - Convert UUID byte array (ala parse()) into a string**
  function unparse(buf, offset) {
    var i = offset || 0, bth = _byteToHex;
    return  bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] + '-' +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]] +
            bth[buf[i++]] + bth[buf[i++]];
  }

  // **`v1()` - Generate time-based UUID**
  //
  // Inspired by https://github.com/LiosK/UUID.js
  // and http://docs.python.org/library/uuid.html

  // random #'s we need to init node and clockseq
  var _seedBytes = _rng();

  // Per 4.5, create and 48-bit node id, (47 random bits + multicast bit = 1)
  var _nodeId = [
    _seedBytes[0] | 0x01,
    _seedBytes[1], _seedBytes[2], _seedBytes[3], _seedBytes[4], _seedBytes[5]
  ];

  // Per 4.2.2, randomize (14 bit) clockseq
  var _clockseq = (_seedBytes[6] << 8 | _seedBytes[7]) & 0x3fff;

  // Previous uuid creation time
  var _lastMSecs = 0, _lastNSecs = 0;

  // See https://github.com/broofa/node-uuid for API details
  function v1(options, buf, offset) {
    var i = buf && offset || 0;
    var b = buf || [];

    options = options || {};

    var clockseq = (options.clockseq != null) ? options.clockseq : _clockseq;

    // UUID timestamps are 100 nano-second units since the Gregorian epoch,
    // (1582-10-15 00:00).  JSNumbers aren't precise enough for this, so
    // time is handled internally as 'msecs' (integer milliseconds) and 'nsecs'
    // (100-nanoseconds offset from msecs) since unix epoch, 1970-01-01 00:00.
    var msecs = (options.msecs != null) ? options.msecs : new Date().getTime();

    // Per 4.2.1.2, use count of uuid's generated during the current clock
    // cycle to simulate higher resolution clock
    var nsecs = (options.nsecs != null) ? options.nsecs : _lastNSecs + 1;

    // Time since last uuid creation (in msecs)
    var dt = (msecs - _lastMSecs) + (nsecs - _lastNSecs)/10000;

    // Per 4.2.1.2, Bump clockseq on clock regression
    if (dt < 0 && options.clockseq == null) {
      clockseq = clockseq + 1 & 0x3fff;
    }

    // Reset nsecs if clock regresses (new clockseq) or we've moved onto a new
    // time interval
    if ((dt < 0 || msecs > _lastMSecs) && options.nsecs == null) {
      nsecs = 0;
    }

    // Per 4.2.1.2 Throw error if too many uuids are requested
    if (nsecs >= 10000) {
      throw new Error('uuid.v1(): Can\'t create more than 10M uuids/sec');
    }

    _lastMSecs = msecs;
    _lastNSecs = nsecs;
    _clockseq = clockseq;

    // Per 4.1.4 - Convert from unix epoch to Gregorian epoch
    msecs += 12219292800000;

    // `time_low`
    var tl = ((msecs & 0xfffffff) * 10000 + nsecs) % 0x100000000;
    b[i++] = tl >>> 24 & 0xff;
    b[i++] = tl >>> 16 & 0xff;
    b[i++] = tl >>> 8 & 0xff;
    b[i++] = tl & 0xff;

    // `time_mid`
    var tmh = (msecs / 0x100000000 * 10000) & 0xfffffff;
    b[i++] = tmh >>> 8 & 0xff;
    b[i++] = tmh & 0xff;

    // `time_high_and_version`
    b[i++] = tmh >>> 24 & 0xf | 0x10; // include version
    b[i++] = tmh >>> 16 & 0xff;

    // `clock_seq_hi_and_reserved` (Per 4.2.2 - include variant)
    b[i++] = clockseq >>> 8 | 0x80;

    // `clock_seq_low`
    b[i++] = clockseq & 0xff;

    // `node`
    var node = options.node || _nodeId;
    for (var n = 0; n < 6; n++) {
      b[i + n] = node[n];
    }

    return buf ? buf : unparse(b);
  }

  // **`v4()` - Generate random UUID**

  // See https://github.com/broofa/node-uuid for API details
  function v4(options, buf, offset) {
    // Deprecated - 'format' argument, as supported in v1.2
    var i = buf && offset || 0;

    if (typeof(options) === 'string') {
      buf = (options === 'binary') ? new BufferClass(16) : null;
      options = null;
    }
    options = options || {};

    var rnds = options.random || (options.rng || _rng)();

    // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;

    // Copy bytes to buffer, if provided
    if (buf) {
      for (var ii = 0; ii < 16; ii++) {
        buf[i + ii] = rnds[ii];
      }
    }

    return buf || unparse(rnds);
  }

  // Export public API
  var uuid = v4;
  uuid.v1 = v1;
  uuid.v4 = v4;
  uuid.parse = parse;
  uuid.unparse = unparse;
  uuid.BufferClass = BufferClass;
  uuid._rng = _rng;
  uuid._mathRNG = _mathRNG;
  uuid._whatwgRNG = _whatwgRNG;

  return uuid;
}

// check for Module/AMD support, otherwise call the uuid function to setup the angular module.
if ('object' !== 'undefined' && module.exports) {
  module.exports = new UUID();

} else if (typeof undefined !== 'undefined' && undefined.amd) {
  // AMD. Register as an anonymous module.
  undefined (function() {
    return new UUID();
  });
  
} else {
  window.uuid = UUID();
}
});

var M;
var T;
var __planeAngle;
var apparentDipCorrection;
var getRatios;
var matrix;
var scaleRatio;
var transpose$1;
var vecAngle;
var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// We don't bundle mathjs right now but can if we figure out how
if (window.math != null) {
  M = window.math;
} else {
  M = core$1();
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
  if (obj instanceof quaternion) {
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
    q = quaternion.fromAxisAngle([0, 0, 1], angle + Math.PI);
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
    hyp = d3$1.select(this).attr('transform', `translate(${-center[0] + xScale(0)},${yScale(0) + center[1]}) rotate(${v})`);
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
      mid = jsUuid.v4();
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
    q = quaternion.fromAxisAngle([0, 0, 1], viewpoint);
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
    q = quaternion.fromAxisAngle([0, 0, 1], viewpoint);
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
    console.log(n, n1);
    qR = quaternion.fromBetweenVectors(n, n1);
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
    this.centered = data.centered;
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

Object.defineProperty(exports, '__esModule', { value: true });

})));
