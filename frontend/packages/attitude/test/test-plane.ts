/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const d3 = require("d3");
const { errorSurface, nominalPlane, math } = require("../src");

// Test implementations of plane functions in javascript
const mode = process.argv[2];
const obj = process.argv[3];

const data = JSON.parse(obj);

const mappable = (fn) => (data) => data.map(fn);

// Run different function depending on mode
const modeFunctions = {
  individual: mappable((d) => math.planeErrors(d.singularValues, d.axes, d)),
  grouped: mappable((d) => math.combinedErrors(d.singularValues, d.axes, d)),
  ellipse: mappable((d) => math.normalErrors(d.singularValues, d.axes, d)),
  deconvolveAxes(d) {
    // Test javascript deconvolution of axes
    return math.deconvolveAxes(d);
  },
};

const fn = modeFunctions[mode];
const val = fn(data);

process.stdout.write(JSON.stringify(val));
