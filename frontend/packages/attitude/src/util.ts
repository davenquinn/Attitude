/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import {sum} from 'd3-array';
//import qh from 'quickhull3d'

const cloneOptions = function(obj, newProps){
  const a = {};
  for (let k in obj) {
    a[k] = newProps[k] || obj[k];
  }
  return a;
};

const computeCentroidAverage = function(planes){
  /*
  Compute centroid of a group of `PlaneData` instances
  using an average of all component measurement centers
  */
  let totalLength = 0;
  const accum = [0,0,0];
  const weights = planes.map(function(plane){
    const d = plane.data;
    if ((d.centered_array == null)) {
      return [0,0,0];
    }
    const len = d.centered_array.length;
    totalLength += len;
    return d.center.map(a => a*len);
  });

  const overallCenter = [0, 1, 2].map(i => d3.sum(weights, d => d[i]/totalLength));
  return overallCenter;
};

const computeCentroidExtrema = function(planes){
  const extrema = [null, null, null];
  for (let p of Array.from(planes)) {
    for (let ix = 0; ix < extrema.length; ix++) {
      const ext = extrema[ix];
      const c = p.data.center[ix];
      if ((ext == null)) { extrema[ix] = [c,c]; }
      const [min,max] = extrema[ix];
      if (c < min) {
        extrema[ix][0] = c;
      }
      if (c > max) {
        extrema[ix][1] = c;
      }
    }
  }
  return extrema.map(([min, max]) => (min+max)/2);
};

export {cloneOptions, computeCentroidAverage, computeCentroidExtrema};
