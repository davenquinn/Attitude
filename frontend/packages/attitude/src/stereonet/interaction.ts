/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import * as d3 from 'd3';
import {select, event} from '../selection';

//# Stereonet Dragging
export default (function(stereonet){
  // modified from http://bl.ocks.org/1392560
  let m0 = undefined;
  let o0 = undefined;
  const proj = stereonet.projection();
  const el = stereonet.node();

  const mousedown = function() {
    m0 = [
      event.pageX,
      event.pageY
    ];
    o0 = stereonet.rotate();
    return event.preventDefault();
  };

  const mousemove = function() {
    if (m0) {
      const m1 = [
        event.pageX,
        event.pageY
      ];
      const o1 = [
        o0[0] + ((m1[0] - (m0[0])) / 3),
        o0[1] + ((m0[1] - (m1[1])) / 3)
      ];
      const limit = 90;
      o1[1] = o1[1] > limit ? limit : o1[1] < -limit ? -limit : o1[1];
      return stereonet.rotate(o1);
    }
  };

  const mouseup = function() {
    if (m0) {
      mousemove();
      return m0 = null;
    }
  };

  el.on('mousedown', mousedown);
  return select(window)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup);
});
