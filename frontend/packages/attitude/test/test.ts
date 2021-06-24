/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const { assert } = require("chai");
const Promise = require("bluebird");
const d3 = require("d3");
const { exec } = require("child_process");
const runCommand = Promise.promisify(exec);
const M = require("mathjs");

const randomPCA = async function () {
  const cmd = `python ${__dirname}/test-runner.py random_pca`;
  const stdout = await runCommand(cmd);
  return JSON.parse(stdout);
};

describe("math module", function () {
  it("should be importable", function () {
    const { math } = require("..");
    return assert(math != null);
  });

  return describe("`Attitude` python module", function () {
    it("should be importable", async function () {
      const [stdout, stderr] = await runCommand('python -c "import attitude"');
      return assert(stderr == null);
    });

    let d = null;
    it("random PCA should produce a 3x3 array", async function () {
      d = await randomPCA();
      const sz = M.size(d);
      return assert(sz[0] === 3 && sz[1] === 3);
    });

    return it("should deconvolve axes", function () {
      const { math, functions } = require("..");

      const axs = math.deconvolveAxes(d);
      const e = math.combinedErrors.apply(null, axs);
      const polygon = functions.errorSurface(e);
      const line = functions.nominalPlane(e);
      const points = line.geometry.coordinates.map((d) => ({
        type: "Feature",

        geometry: {
          type: "Point",
          coordinates: d,
        },
      }));

      const pt = points[0];
      const v = d3.geoContains(polygon, pt);
      return assert(v, "point is in polygon");
    });
  });
});
