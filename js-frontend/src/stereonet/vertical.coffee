d2r = Math.PI/180
module.exports = (stereonet)->
  (opts={})->
    opts.startOffset ?= 10
    # correct for start at bottom
    opts.startOffset += 100
    opts.labelPadding ?= 8

    g = stereonet.overlay()

    grat = stereonet.graticule()
    console.log grat

    labels = ["N","E","S","W"]
    locs = [0,90,180,270]

    az = g.append 'g'
      .attr 'class','azimuthLabels'

    m = stereonet.margin()
    innerRadius = stereonet.size()/2-m
    sel = az.selectAll 'text'
      .data labels

    sel.enter()
      .append 'text'
      .text (d)->d
      .attrs (d,i)->
        szm = innerRadius+m
        angle = (locs[i]-90)*Math.PI/180
        {
          transform: "translate(#{szm} #{szm})"
          x: Math.cos(angle)*(innerRadius+opts.labelPadding)
          y: Math.sin(angle)*(innerRadius+opts.labelPadding)
        }

    dip = g.append 'g'
      .attr 'class', 'dipLabels'

    lon = 220
    feat = (d)->
      {
        type: 'Feature'
        label: "#{d}°"
        geometry:
          type: 'Point'
          coordinates: [lon,-90+d]
      }

    dy = 8
    a = stereonet.clipAngle()
    v = (x for x in [5..a] by 5)
    proj = stereonet.projection()
    sel = dip.selectAll 'text'
      .data v.map(feat)
    sel.enter()
      .append 'text'
      .text (d)->d.label
      .attr "transform", (d)->
        v = proj(d.geometry.coordinates)
        "translate(#{v[0]}, #{v[1]}) rotate(#{180-lon})"

    at = {class: 'outer', dy: -dy}
    # Labels
    az.append 'text'
      .attrs at
      .append 'textPath'
        .text 'Azimuth →'
        .attrs
          'xlink:href': '#sphere'
          startOffset: "#{innerRadius*opts.startOffset*d2r}"
          method: 'stretch'
    dip.append 'text'
      .attrs at
      .append 'textPath'
        .text 'Dip'
        .attrs
          method: 'stretch'
          'xlink:href': '#sphere'
          startOffset: "#{innerRadius*70*d2r}"
