/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

const d = {
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

const attrs = (sel, obj) => (() => {
  const result = [];
  for (let k in obj) {
    const v = obj[k];
    result.push(sel.attr(k,v));
  }
  return result;
})();

export default (function(stereonet){
  const labelDistance = 4;
  return function() {
    const da = stereonet.overlay();
    const g = da.append('g')
      .attr('class', 'horizontal');

    g.append('path')
      .datum(d);

    const sz = stereonet.size();
    const margin = stereonet.margin();
    const l = g.append('g')
      .attr('class', 'labels')
      .attr('transform', `translate(${margin} ${sz/2})`);

    let obj = l.append('text')
      .text('E');
    
    attrs(obj, {
        class: 'axis-label',
        transform: `translate(${sz-(2*margin)} 0)`,
        'text-anchor': 'start',
        dx: labelDistance
    });

    obj = l.append('text')
      .text('W');
    
    attrs(obj, {
        class: 'axis-label',
        'text-anchor': 'end',
        dx: -labelDistance
    });

    // Vertical labels (may split out later)
    const v = da.append('g')
      .attr('class', 'vertical')
      .attr('transform', `translate(${sz/2} ${margin})`);

    v.append('line')
      .attr('y2', labelDistance);

    v.append('line')
      .attr('transform', `translate(0 ${sz-(2*margin)})`)
      .attr('y2', -labelDistance);

    obj = v.append('text')
      .text('Vertical');
    
    return attrs(obj, {
        class: 'axis-label',
        'alignment-baseline': 'baseline',
        'text-anchor': 'middle',
        dy: -labelDistance-4
    });
  };
});
