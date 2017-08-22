// Generated by CoffeeScript 1.12.6
var Stereonet, addItem, d, d3, data, el, i, j, len, ref, stereonet;

d3 = require('d3');

Stereonet = require('./stereonet.coffee');

el = d3.select('.stereonet');

d = el.attr('data-curves');

data = JSON.parse(d);

el.attr('data-curves', '');

console.log(data);

stereonet = new Stereonet(el.node());

addItem = function(d, opts) {
  var j, len, level, ref;
  ref = [1, 2];
  for (j = 0, len = ref.length; j < len; j++) {
    level = ref[j];
    opts.level = level;
    stereonet.addGirdle(d[level], opts);
    stereonet.addEllipse(d[level].ellipse, opts);
  }
  return stereonet.addPath(d.nominal, opts);
};

if (data.components.length > 0) {
  ref = data.components;
  for (j = 0, len = ref.length; j < len; j++) {
    i = ref[j];
    addItem(i, {
      "class": 'component'
    });
  }
}

console.log(data.main);

addItem(data.main, {
  "class": 'main'
});

stereonet.draw();