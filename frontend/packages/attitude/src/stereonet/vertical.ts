/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
import { scaleLinear } from "d3-scale";

const d2r = Math.PI / 180;
export default (stereonet) =>
  function (opts) {
    if (opts == null) {
      opts = {};
    }
    if (opts.startOffset == null) {
      opts.startOffset = 10;
    }
    // correct for start at bottom
    opts.startOffset += 100;
    if (opts.labelPadding == null) {
      opts.labelPadding = 2;
    }
    let { dipLabels, nLabels } = opts;
    if (nLabels == null) {
      nLabels = 2;
    }
    const dy = opts.labelPadding;

    const g = stereonet.overlay();

    const grat = stereonet.graticule();
    console.log(grat);

    const labels = ["N", "E", "S", "W"];
    const textAnchor = ["middle", "start", "middle", "end"];
    const alignmentBaseline = [null, "middle", "hanging", "middle"];
    const padding = [3, 0, 3, 0];
    const locs = [0, 90, 180, 270];

    const az = g.append("g").attr("class", "azimuthLabels");

    const m = stereonet.margin();
    const innerRadius = stereonet.size() / 2 - m;
    let sel = az.selectAll("text").data(labels);

    sel
      .enter()
      .append("text")
      .text((d) => d)
      .styles((d, i) => ({
        "alignment-baseline": alignmentBaseline[i],
        "text-anchor": textAnchor[i],
      }))
      .attr("transform", function (d, i) {
        const szm = innerRadius + m;
        const angle = ((locs[i] - 90) * Math.PI) / 180;
        const z = innerRadius + opts.labelPadding + padding[i];
        const x = szm + Math.cos(angle) * z;
        let y = szm + Math.sin(angle) * z;
        if (i === 0) {
          y -= 3;
        }
        return `translate(${x} ${y})`;
      });

    const dip = g.append("g").attr("class", "dipLabels");

    const lon = 220;
    const feat = (d) => ({
      type: "Feature",
      label: `${d}°`,

      geometry: {
        type: "Point",
        coordinates: [lon, -90 + d],
      },
    });

    const a = stereonet.clipAngle();
    if (dipLabels == null) {
      dipLabels = scaleLinear([0, a]).ticks(nLabels);
    }

    const proj = stereonet.projection();
    sel = dip.selectAll("text").data(dipLabels.map(feat));
    sel
      .enter()
      .append("text")
      .attr("class", "inner")
      .text((d) => d.label)
      .attr("transform", function (d) {
        const v = proj(d.geometry.coordinates);
        return `translate(${v[0]}, ${v[1]}) rotate(${180 - lon})`;
      });

    const sphereId = `#${stereonet.uid()}-sphere`;

    const at = { dy: -dy - 3, class: "outer" };
    // Labels
    az.append("text")
      .attrs(at)
      .append("textPath")
      .text("Azimuth →")
      .attrs({
        "xlink:href": sphereId,
        startOffset: `${innerRadius * opts.startOffset * d2r}`,
        method: "stretch",
      });
    dip
      .append("text")
      .attrs(at)
      .append("textPath")
      .text("Dip")
      .attrs({
        method: "stretch",
        "xlink:href": sphereId,
        startOffset: `${innerRadius * 70 * d2r}`,
      });
  };
