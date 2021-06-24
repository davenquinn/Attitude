/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/*
Stereonet labeling:
Based heavily on http://bl.ocks.org/dwtkns/4686432

TODO: integrate text halos
http://bl.ocks.org/nitaku/aff4f425e7959290a1f7
*/
import {geoPath, geoDistance} from 'd3';

const labels = [
  {name: 'N', c: [180,0]},
  {name: 'E', c: [90,0]},
  {name: 'S', c: [0,0]},
  {name: 'W', c: [-90,0]},
  {name: 'Up', c: [0,90]},
  {name: 'Down', c: [0,-90]}
];

const __horizontalLine = {
  type: 'Feature',
  geometry: {
    type: 'LineString',
    coordinates: [
      [180,0],
      [-90,0],
      [0,0],
      [90,0],
      [180,0]
    ]
  }
};

const horizontalLine = function(stereonet){
  stereonet
    .overlay()
    .append('g')
    .attr("class","horizontal")
    .append('path')
    .datum(__horizontalLine);
  return stereonet.refresh();
};

const globalLabels = function(opts){
  if (opts == null) { opts = {}; }
  let {offsetAmount} = opts;
  if (offsetAmount == null) { offsetAmount = 3; }
  for (let l of Array.from(labels)) {
    l.type = 'Feature';
    l.geometry = {type: 'Point', coordinates: l.c};
  }

  return function(stereonet){
    const sz = stereonet.size();
    let proj = stereonet.projection();
    const svg = stereonet.overlay();

    const path = geoPath()
      .projection(proj)
      .pointRadius(1);

    const container = svg.append("g")
      .attr("class", "labels");


    const updateLabels = function() {
      console.log("Updating labels");
      proj = this.projection();
      const centerPos = proj.invert([sz/2,sz/2]);
      const width = stereonet.size();

      const v = container.selectAll(".label");

      v.select('text')
        .attr('stroke', 'white')
        .attr('stroke-width', '3px')
        .attr('paint-order', 'stroke')
        .attr('alignment-baseline', 'middle')
        .attr("text-anchor", function(d){
          const x = proj(d.geometry.coordinates)[0];
          if (x < ((width/2)-20)) {
            return 'end';
          }
          if (x < ((width/2)+20)) {
            return 'middle';
          }
          return 'start';
      }).attr("transform", function(d){
          const [x,y] = proj(d.geometry.coordinates);
          const offset = x < (width/2) ? -offsetAmount : offsetAmount;
          let offsetY = 0;
          if (y < ((width/2)-20)) {
            offsetY = -9;
          }
          if (y > ((width/2)+20)) {
            offsetY = 7;
          }
          return `translate(${x+offset},${y+2+offsetY})`;
      });

      return v.style("display", function(d){
          const dist = geoDistance(centerPos,d.geometry.coordinates);
          if ((d.name === 'Up') || (d.name === 'Down')) {
            if (dist < (Math.PI/4)) { return 'none'; }
          }
          if (dist < 0.01) { return 'none'; }
          if (dist > ((Math.PI/2)+0.01)) { return 'none'; } else { return 'inline'; }
      });
    };

    stereonet.call(horizontalLine);

    const esel = container
      .selectAll("g.label")
      .data(labels)
      .enter()
      .append('g.label');

    esel.append("path")
      .attr("class", "point");

    esel.append("text")
      .text(d => d.name);

    updateLabels.apply(stereonet);

    return stereonet.on('rotate', updateLabels);
  };
};

export {globalLabels};
