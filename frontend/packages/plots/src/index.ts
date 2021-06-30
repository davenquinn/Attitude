const fs = require("fs");
const d3 = require("d3");
require("d3-selection-multi");
const { functions, math } = require("attitude");
const style = require("./main.styl");
const { Stereonet } = require("attitude");
const chroma = require("chroma-js");
require("stereonet/style.styl");
const regroupData = require("../regroup-data.coffee");

const opts = {
  degrees: true,
  traditionalLayout: false,
  adaptive: true,
  n: 60, // Bug if we go over 60?
  level: [1] // 95% ci for 2 degrees of freedom
};

// Functions for two levels of error ellipse
const createEllipses = functions.errorEllipse(opts);

const setStyle = function(d, i) {
  const e = d3.select(this);

  const cfunc = function(max) {
    let a = (max / d.max_angular_error) * 5;
    if (a > 0.8) {
      a = 0.8;
    }
    if (isNaN(a)) {
      a = 0.5;
    }
    return a;
  };

  const color = chroma(d.color);
  const fill = color.alpha(cfunc(1)).css();
  const stroke = color.alpha(cfunc(2)).css();
  console.log(cfunc(1));

  const v = e.selectAll("path").attrs({ fill, stroke });
  if (d.in_group) {
    return v.attrs({
      "stroke-dasharray": "2,2",
      fill: "transparent"
    });
  }
};

export default function(el, data, opts = {}) {
  if (opts.clipAngle == null) {
    opts.clipAngle = 15;
  }
  if (opts.size == null) {
    opts.size = 400;
  }
  if (opts.margin == null) {
    opts.margin = 25;
  }

  const stereonet = Stereonet()
    .margin(opts.margin)
    .clipAngle(opts.clipAngle)
    .size(opts.size)
    .graticule(30, 2.5);

  const svg = el.classed("stereonet", true).call(stereonet);

  //const fn = regroupData(opts.groupings || []);
  //data = await fn(data);

  stereonet
    .ellipses(data) //.filter (d)-> not d.in_group
    .each(setStyle)
    .on("mouseover", d => console.log(d.id, d.in_group, d.ids || []));

  stereonet.vertical();
  stereonet.draw();

  return el.selectAll("text.outer").attr("dy", -4);
}
