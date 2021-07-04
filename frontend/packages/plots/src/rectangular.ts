/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { select, scaleLinear } from "d3";
import chroma from "chroma-js";
import { useRef, useEffect } from "react";
import h from "@macrostrat/hyper";
import "./main.styl";

import { Stereonet, opacityByCertainty, globalLabels } from "@attitude/core";
import { AzimuthLabels, DipLabels } from "./graticule-labels";

const scale = scaleLinear().domain([2, 10]).range([0.8, 0.2]).clamp(true);

function drawStereonet(el_, data) {
  console.log(data);

  const margin = 25;
  const size = { height: 390, width: 800 };
  const innerSize = {
    height: size.height - margin - 10,
    width: size.width - margin - 35,
  };

  const stereonet = Stereonet()
    .size(800)
    .margin(margin)
    .graticule(10, 10)
    .clipAngle(40)
    .center([-60, -72, 70])
    .rectangular(innerSize);

  const el = select(el_)
    .attr("width", size.width)
    .attr("height", size.height)
    .attr("viewBox", `0 0 ${size.width} ${size.height}`)
    .append("g")
    .call(stereonet);

  const p = stereonet
    .projection()
    .translate([260, innerSize.height / 2 + margin]);

  stereonet
    .ellipses(data)
    .each(opacityByCertainty((d) => d.color, "path.error"));

  stereonet.draw();

  // Graticule labels
  const z = innerSize.height + margin;
  let az = new DipLabels(stereonet)
    .alongLine([50, z], [innerSize.width, z])
    .textOffset([0, 15]);

  az.render(el);

  az.container
    .append("text")
    .attr("transform", `translate(${margin} ${z + 15})`)
    .attr("text-anchor", "start")
    .text(az.labelText);

  const x = innerSize.width + 5;
  az = new AzimuthLabels(stereonet)
    .alongLine([x, 5], [x, z])
    .textOffset([10, 0]);

  az.render(el).select("text").attr("transform", "translate(15,0) rotate(-90)");

  return az.container
    .append("text")
    .attr(
      "transform",
      `translate(${x + 30} ${innerSize.height / 2 + 5}) rotate(-90)`
    )
    .attr("text-anchor", "middle")
    .text(az.labelText);
}

function RectangularStereonet({ data }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current == null) return;
    drawStereonet(ref.current, data);
  }, [ref, data]);
  return h("div.plot-container", null, h("svg.plot", { ref }));
}

export { RectangularStereonet };
