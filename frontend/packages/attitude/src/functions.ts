/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { geoArea, geoContains, select } from "d3";
import "d3-selection-multi";
import * as math from "./math";
import { cloneOptions } from "./util";
import { Orientation, reconstructErrors } from "./reconstruct";

const { combinedErrors } = math;

const createFeature = (type, coordinates) => ({
  type: "Feature",

  geometry: {
    type,
    coordinates,
  },
});

const createErrorSurface = function (d, baseData = null) {
  // Function that turns orientation
  // objects into error surface
  const e = [d.lower, d.upper.reverse()];

  let f = createFeature("Polygon", e);
  if (!geoContains(f, d.nominal[0])) {
    f = createFeature(
      "Polygon",
      e.map((d) => d.reverse())
    );
  }

  const a = geoArea(f);
  if (f.properties == null) {
    f.properties = {};
  }
  f.properties.area = a;
  if (baseData != null) {
    f.data = baseData;
  }
  return f;
};

const createNominalPlane = function (d, baseData = null) {
  const obj = createFeature("LineString", d.nominal);
  if (baseData != null) {
    obj.data = baseData;
  }
  return obj;
};

const flipAxesIfNeeded = function (axes) {
  if (axes[2][2] < 0) {
    axes[2] = axes[2].map((e) => -e);
  }
  return axes;
};

const createGroupedPlane = function (opts) {
  if (opts.nominal == null) {
    opts.nominal = true;
  }

  return function (p) {
    let { hyperbolic_axes, axes, covariance } = p;
    // To preserve compatibility
    if (hyperbolic_axes == null) {
      hyperbolic_axes = covariance;
    }

    // Make sure axes are not inverted
    axes = flipAxesIfNeeded(axes);

    const e = combinedErrors(hyperbolic_axes, axes, opts);
    const el = select(this);
    el.append("path")
      .datum(createErrorSurface(e, p))
      .attr("class", "error")
      .classed("unconstrained", hyperbolic_axes[2] > hyperbolic_axes[1]);

    if (!opts.nominal) {
      return;
    }
    // Create nominal plane
    return el
      .append("path")
      .datum(createNominalPlane(e, p))
      .attr("class", "nominal");
  };
};

interface ErrorEllipseProps {
  hyperbolic_axes: math.Vector3;
  axes: math.Matrix3;
  covariance?: math.Vector3;
}

const __createErrorEllipse = function (opts) {
  //Function generator to create error ellipse
  //for a single error level
  return function (props: ErrorEllipseProps | Orientation) {
    console.log(props);
    let { hyperbolic_axes, axes, covariance } = props;
    // To preserve compatibility
    hyperbolic_axes ??= covariance;

    const f_ = function (sheet) {
      opts.sheet = sheet;
      if (hyperbolic_axes == null && props.strike != null) {
        const v = reconstructErrors(props as Orientation);
        hyperbolic_axes = v.hyp;
        axes = v.axes;
      }
      const errors = math.normalErrors(hyperbolic_axes, axes, opts);
      let f = createFeature("Polygon", [errors]);

      // Check winding (note: only an issue with non-traditional
      // stereonet axes)
      let a = geoArea(f);
      if (a > 2 * Math.PI) {
        f = createFeature("Polygon", [errors.reverse()]);
        a = geoArea(f);
      }
      f.properties = {
        area: a,
        level: opts.level,
        sheet,
      };
      f.data = props;
      return f;
    };

    const v = ["upper", "lower"].map(f_);
    const coords = v.map((d) => d.geometry.coordinates);
    const f = createFeature("MultiPolygon", coords);
    f.properties = v[0].properties;
    return f;
  };
};

const createErrorEllipse = function (opts) {
  // Level can be single or array of error levels
  if (opts.level == null) {
    opts.level = 1;
  }
  const levels = opts.level;

  const __fnAtLevel = function (l) {
    const o1 = cloneOptions(opts, { level: l });
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

export {
  createFeature,
  createGroupedPlane as plane,
  createErrorSurface as errorSurface,
  createNominalPlane as nominalPlane,
  createErrorEllipse as errorEllipse,
};
