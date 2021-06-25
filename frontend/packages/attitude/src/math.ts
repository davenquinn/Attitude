import * as d3 from "d3";
import _ from "underscore";

/*
const transpose = function (array, length = null) {
  if (length == null) {
    ({ length } = array[0]);
  }
  const newArray = __range__(0, length, false).map(() => []);
  for (
    let i = 0, end = array.length, asc = 0 <= end;
    asc ? i < end : i > end;
    asc ? i++ : i--
  ) {
    for (
      let j = 0, end1 = length, asc1 = 0 <= end1;
      asc1 ? j < end1 : j > end1;
      asc1 ? j++ : j--
    ) {
      newArray[j].push(array[i][j]);
    }
  }
  return newArray;
};
*/

const transpose = (res: Matrix3): Matrix3 => _.zip.apply(_, res);

type Vector3 = [number, number, number];
type Matrix3 = [Vector3, Vector3, Vector3];

const identity: Matrix3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const norm = function (d) {
  // L2 norm (hypotenuse)
  const _ = d.map((a) => a * a);
  return Math.sqrt(d3.sum(_));
};

const sdot = function (a, b) {
  const zipped = __range__(0, a.length, true).map((i) => a[i] * b[i]);
  return d3.sum(zipped);
};

const ellipse = function (opts) {
  // Basic function to create an array
  // of cosines and sines for error-ellipse
  // generation
  if (opts == null) {
    opts = {};
  }
  if (opts.n == null) {
    opts.n = 50;
  }
  opts.adaptive = true;
  const ellAdaptive = function (a, b) {
    // Takes major, minor axis lengths
    const i_ = 1;
    const v = opts.n / 2;
    const stepSize = 2 / v;
    // Make a linearly varying space on the
    // interval [1,-1]
    const angles = [];

    for (
      let i = 0, end = v, asc = 0 <= end;
      asc ? i < end : i > end;
      asc ? i++ : i--
    ) {
      const sinAngle = -1 + i * stepSize;
      angles.push([b * Math.cos(Math.asin(sinAngle)), a * sinAngle]);
    }

    const a1 = angles.slice(1).map(([a, b]) => [-a, b]);
    a1.reverse();

    // Opposite of first
    return [...angles, [0, a], ...a1];
  };

  return ellAdaptive;
};

const cart2sph = function (opts) {
  if (opts == null) {
    opts = {};
  }
  if (opts.degrees == null) {
    opts.degrees = false;
  }
  if (opts.traditionalLayout == null) {
    opts.traditionalLayout = false;
  }
  if (opts.upperHemisphere == null) {
    opts.upperHemisphere = true;
  }
  const c = opts.degrees ? 180 / Math.PI : 1;
  return function (d) {
    let x, y, z;
    const r = norm(d);

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

const planeErrors = function (axesCovariance, axes, opts) {
  // Get a single level of planar errors (or the
  // plane's nominal value) as a girdle
  if (opts == null) {
    opts = {};
  }
  if (opts.n == null) {
    opts.n = 100;
  }
  if (opts.upperHemisphere == null) {
    opts.upperHemisphere = true;
  }
  const sheet = opts.sheet || "nominal";
  if (axes == null) {
    axes = identity;
  }
  if (opts.traditionalLayout == null) {
    opts.traditionalLayout = true;
  }

  const s = axesCovariance.map(Math.sqrt);
  axes = transpose(axes);

  const scales = {
    upper: 1,
    lower: -1,
    nominal: 0,
  };

  let c1 = scales[sheet];
  if (opts.upperHemisphere) {
    c1 *= -1;
  }
  // Flip upper and lower rings
  if (axes[2][2] < 0) {
    c1 *= -1;
  }

  const stepFunc = function (a) {
    // Takes an array of [cos(a),sin(a)]
    const e = [a[1], a[0], s[2] * c1];
    return Array.from(axes).map((i) => sdot(e, i));
  };

  const ell = ellipse(opts);
  return ell(s[0], s[1]).map(stepFunc).map(cart2sph(opts));
};

interface NormalErrorsOpts {
  n?: number;
  upperHemisphere?: boolean;
  traditionalLayout?: boolean;
  sheet?: string;
  level?: number;
}

const normalErrors = function (
  axesCovariance: Vector3,
  axes: Matrix3,
  opts: NormalErrorsOpts = {}
) {
  // Get a single level of planar errors (or the
  // plane's nominal value) as a girdle

  // Should use adaptive resampling
  // https://bl.ocks.org/mbostock/5699934

  opts.n ??= 100;
  opts.upperHemisphere ??= true;
  opts.traditionalLayout ??= true;
  opts.sheet ??= "upper";
  opts.level ??= 1;
  axes ??= identity;

  const scales = {
    upper: 1,
    lower: -1,
  };

  const s = axesCovariance.map(Math.sqrt);
  axes = transpose(axes);

  const v0 = scales[opts.sheet];
  let c1 = 1 * v0;
  if (opts.upperHemisphere) {
    c1 *= -1;
  }
  c1 *= opts.level;

  //if axes[2][2] < 0
  //  for i in [0..2]
  //    axes[i] = axes[i].map (d)->d*-1
  //  c1 *= -1

  const stepFunc = function (es) {
    const e = es.map((d, i) => (-d * c1 * s[2]) / s[i]);
    e.push(norm(es) * v0);

    return (() => {
      const result = [];
      for (let i of Array.from(axes)) {
        result.push(sdot(e, i));
      }
      return result;
    })();
  };

  const ell = ellipse(opts);
  return ell(s[0], s[1]).map(stepFunc).map(cart2sph(opts));
};

const combinedErrors = function (sv, ax, opts) {
  let out;
  if (opts == null) {
    opts = {};
  }
  const func = function (type) {
    opts.sheet = type;
    opts.degrees = true;
    return planeErrors(sv, ax, opts);
  };

  return (out = {
    nominal: func("nominal"),
    upper: func("upper"),
    lower: func("lower"),
  });
};

const convolveAxes = function (axes, sv) {
  // Convolve unit-length principal axes
  // with singular values to form vectors
  // representing the orientation and magnitude
  // of hyperbolic axes
  // In case we don't pass normalized axes
  let residual;
  [residual, axes] = deconvolveAxes(axes);
  return axes.map((row, i) => row.map((e) => e * sv[i]));
};

var deconvolveAxes = function (axes) {
  // Deconvolve unit-length principal axes and
  // singular values from premultiplied principal axes
  // Inverse of `convolveAxes`
  const ax = transpose(axes);
  const sv = ax.map(norm);
  for (
    let i = 0, end = axes.length, asc = 0 <= end;
    asc ? i < end : i > end;
    asc ? i++ : i--
  ) {
    for (
      let j = 0, end1 = axes.length, asc1 = 0 <= end1;
      asc1 ? j < end1 : j > end1;
      asc1 ? j++ : j--
    ) {
      axes[j][i] /= sv[i];
    }
  }
  return [sv, axes];
};

export {
  norm,
  cart2sph,
  planeErrors,
  normalErrors,
  combinedErrors,
  transpose,
  convolveAxes,
  deconvolveAxes,
  Vector3,
  Matrix3,
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
