// Generated by CoffeeScript 2.0.1
var Stereonet, chroma, copyIDToClipboard, globalLabels, opacityByCertainty, readTextFile;

readTextFile = function(file, callback) {
  var rawFile;
  rawFile = new XMLHttpRequest;
  rawFile.overrideMimeType('application/json');
  rawFile.open('GET', file, true);
  rawFile.onreadystatechange = function() {
    if (rawFile.readyState === 4 && rawFile.status === 200) {
      return callback(rawFile.responseText);
    }
  };
  return rawFile.send(null);
};

({Stereonet, opacityByCertainty, globalLabels, chroma} = window.attitude);

copyIDToClipboard = function(d) {
  return console.log(d.uid);
};

console.log('stuff');

readTextFile('/data.json', function(text) {
  var M, PlaneData, __domain, __dw, _x, accum, apparentDip, axes, azLabel, c, collectID, collectedIDs, darkenColor, data, dataA, dataArea, digitizedLine, errorContainer, errorContainerGrouped, f, fixAngle, fmt, group, hyperbolicErrors, innerSize, j, k, len1, len2, lineGenerator, margin, marginLeft, marginRight, overallCenter, p, planeContainer, setScale, singlePlanes, stereonet, svg, sz, totalLength, updatePlanes, updateSelected, weights, x, xA, xAx, y, yA, yAx;
  data = JSON.parse(text);
  console.log(data);
  /*
  Stereonet
  */
  stereonet = Stereonet().size(400).margin(25);
  svg = d3.select('#stereonet').attr('class', 'stereonet').call(stereonet);
  c = function(d) {
    return d.color;
  };
  dataA = data;
  stereonet.planes(dataA).each(opacityByCertainty(c, 'path.error')).classed('in-group', function(d) {
    return d.member_of != null;
  }).classed('is-group', function(d) {
    return d.members != null;
  }).each(function(d) {
    if (d.max_angular_error > 45) {
      d3.select(this).select('path.error').remove();
    }
    return d3.select(this).select('path.nominal').attr('stroke', d.color);
  });
  stereonet.call(globalLabels());
  stereonet.draw();
  darkenColor = function(c) {
    return chroma(c).darken(2).css();
  };
  fmt = d3.format('.0f');
  updateSelected = function(d) {
    var dA, updateValue;
    planeContainer.selectAll('path.trace').attr('stroke', function(v) {
      c = darkenColor(v.color);
      if (d == null) {
        return c;
      }
      if (v.data.uid === d.uid) {
        c = v.color;
      }
      return c;
    });
    dA = d3.select("div#data div.plane-desc");
    stereonet.dataArea().select('g.hovered').remove();
    if (d == null) {
      dA.style('display', 'none');
      return;
    }
    stereonet.planes([d], {
      selector: 'g.hovered'
    }).each(function(d) {
      var s;
      s = d3.select(this);
      s.select('path.error').attrs({
        fill: d.color,
        'fill-opacity': 0.5
      });
      return s.select('path.nominal').attr('stroke', d.color);
    });
    dA.style('display', 'block');
    dA.select("span.id").text(d.uid);
    updateValue = function(id, num) {
      return dA.select(`span.${id}`).text(fmt(num));
    };
    updateValue('strike', d.strike);
    updateValue('dip', d.dip);
    updateValue('min', d.min_angular_error);
    return updateValue('max', d.max_angular_error);
  };
  svg.selectAll('g.planes g.plane path.error').on('mouseenter', function(d) {
    d = d3.select(this.parentElement).datum();
    return updateSelected(d);
  }).on('click', function(d) {
    d = d3.select(this.parentElement).datum();
    return collectID(d.data.uid);
  });
  d3.select(".attitude-area").on('mouseleave', function() {
    return updateSelected();
  });
  /*
  Horizontal
  */
  M = math;
  ({hyperbolicErrors, apparentDip, digitizedLine, PlaneData, fixAngle} = attitude);
  for (j = 0, len1 = dataA.length; j < len1; j++) {
    f = dataA[j];
    f.is_group = f.members != null;
  }
  singlePlanes = dataA.filter(function(d) {
    return !d.is_group;
  }).map(function(d) {
    return new PlaneData(d);
  });
  totalLength = 0;
  accum = [0, 0, 0];
  weights = singlePlanes.map(function(plane) {
    var d, len;
    d = plane.data;
    if (d.centered_array == null) {
      return [0, 0, 0];
    }
    len = d.centered_array.length;
    totalLength += len;
    return d.center.map(function(a) {
      return a * len;
    });
  });
  overallCenter = [0, 1, 2].map(function(i) {
    return d3.sum(weights, function(d) {
      return d[i] / totalLength;
    });
  });
  for (k = 0, len2 = singlePlanes.length; k < len2; k++) {
    p = singlePlanes[k];
    p.offset = M.subtract(p.mean, overallCenter);
    p.in_group = false;
    if (p.data.member_of != null) {
      group = dataA.find(function(d) {
        return d.uid === p.data.member_of;
      });
      p.group = new PlaneData(group, p.mean);
      p.group.offset = p.offset;
      p.in_group = true;
    }
  }
  margin = 30;
  marginLeft = 50;
  marginRight = 100;
  sz = {
    width: 800,
    height: 300
  };
  innerSize = {
    width: sz.width - marginLeft - marginRight,
    height: sz.height - 2 * margin
  };
  svg = d3.select('svg#horizontal').at(sz).append('g').at({
    transform: `translate(${marginLeft},${margin})`
  });
  x = d3.scaleLinear().range([0, innerSize.width]).domain([-1000, 1000]);
  y = d3.scaleLinear().range([innerSize.height, 0]).domain([-600, 600]);
  dataArea = svg.append('g.data');
  /* Setup data */
  errorContainer = dataArea.append('g.errors');
  errorContainerGrouped = dataArea.append('g.errors-grouped');
  planeContainer = dataArea.append('g.planes');
  setScale = function(scale, mPerPx) {
    var mWidth, r, w;
    r = scale.range();
    w = r[1] - r[0];
    mWidth = Math.abs(w * mPerPx);
    return scale.domain([-mWidth / 2, mWidth / 2]);
  };
  setScale(x, 0.8);
  setScale(y, 0.8);
  lineGenerator = d3.line().x(function(d) {
    return x(d[0]);
  }).y(function(d) {
    return y(d[1]);
  });
  updatePlanes = function(angle) {
    var az, dataWithTraces, df, ese, esel, gp, hyp, se, sel, v_;
    v_ = M.eye(3).toArray();
    hyp = hyperbolicErrors(angle, v_, x, y).width(150).nominal(false);
    if (!d3.select('#gradient').node()) {
      errorContainer.call(hyp.setupGradient);
    }
    // Individual data
    //# We have some problems showing large error angles
    sel = errorContainer.selectAll('g.error-hyperbola').data(singlePlanes);
    esel = sel.enter().append('g.error-hyperbola').classed('in-group', function(d) {
      return d.group != null;
    });
    esel.merge(sel).each(hyp).sort(function(a, b) {
      return a.__z - b.__z;
    });
    // Grouped data
    gp = singlePlanes.filter(function(d) {
      return d.group != null;
    }).map(function(d) {
      return d.group;
    });
    sel = errorContainerGrouped.selectAll('g.error-hyperbola').data(gp);
    esel = sel.enter().append('g.error-hyperbola');
    esel.merge(sel).each(hyp).sort(function(a, b) {
      return a.__z - b.__z;
    });
    dataWithTraces = singlePlanes.filter(function(d) {
      return d.centered != null;
    });
    se = planeContainer.selectAll('path.trace').data(dataWithTraces);
    ese = se.enter().append('path.trace').attr('stroke', function(d) {
      return darkenColor(d.color);
    }).on('mouseover', function(d) {
      return updateSelected(d.data);
    }).on('click', function(d) {
      return collectID(d.data.uid);
    });
    df = digitizedLine(angle, lineGenerator);
    ese.merge(se).each(df);
    az = fmt(fixAngle(angle + Math.PI / 2) * 180 / Math.PI);
    return azLabel.text(`Distance along ${az}º`);
  };
  stereonet.on('rotate.cb', function() {
    var az, lat, lon;
    [lon, lat] = this.centerPosition();
    az = lon;
    az *= -Math.PI / 180;
    return updatePlanes(az);
  });
  /* Setup axes */
  axes = svg.append('g.axes');
  yA = d3.scaleLinear().domain(y.domain().map(function(d) {
    return d + overallCenter[2];
  })).range(y.range());
  yAx = d3.axisLeft(yA).tickFormat(fmt).tickSizeOuter(0);
  axes.append('g.y.axis').call(yAx).append('text.axis-label').text('Elevation (m)').attr('transform', `translate(-40,${innerSize.height / 2}) rotate(-90)`).style('text-anchor', 'middle');
  __domain = x.domain();
  __dw = __domain[1] - __domain[0];
  xA = d3.scaleLinear().domain([0, __dw]).range(x.range());
  xAx = d3.axisBottom(xA).tickFormat(fmt).tickSizeOuter(0);
  _x = axes.append('g.x.axis').translate([0, innerSize.height]).call(xAx);
  azLabel = _x.append('text.axis-label').attr('transform', `translate(${innerSize.width / 2},20)`).style('text-anchor', 'middle');
  /* Update data after setup */
  updatePlanes(0);
  /* Collected ids */
  collectedIDs = [];
  return collectID = function(id) {
    var cid, ix;
    console.log(id);
    ix = collectedIDs.indexOf(id);
    console.log(ix);
    if (ix === -1) {
      collectedIDs.push(id);
    } else {
      collectedIDs.splice(ix, 1);
    }
    cid = collectedIDs.map(function(v) {
      return `"${v}"`;
    });
    console.log(cid.join(','));
    return d3.select('.collected-ids').text(`[${cid.join(',')}]`);
  };
});
