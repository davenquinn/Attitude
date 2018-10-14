import {scaleLinear} from 'd3-scale'

d2r = Math.PI/180
export default (stereonet)->
  (opts={})->
    opts.startOffset ?= 10
    # correct for start at bottom
    opts.startOffset += 100
    opts.labelPadding ?= 2
    {dipLabels, nLabels} = opts
    nLabels ?= 2
    dy = opts.labelPadding

    g = stereonet.overlay()

    grat = stereonet.graticule()
    console.log grat

    labels = ["N","E","S","W"]
    textAnchor = ['middle','start','middle','end']
    alignmentBaseline = [null,'middle','hanging','middle']
    padding = [3,0,3,0]
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
      .styles (d,i)->
        {'alignment-baseline': alignmentBaseline[i], 'text-anchor': textAnchor[i]}
      .attr 'transform', (d,i)->
        szm = innerRadius+m
        angle = (locs[i]-90)*Math.PI/180
        z = (innerRadius+opts.labelPadding+padding[i])
        x = szm+Math.cos(angle)*z
        y = szm+Math.sin(angle)*z
        if i == 0
          y -= 3
        return "translate(#{x} #{y})"

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

    a = stereonet.clipAngle()
    if not dipLabels?
      dipLabels = scaleLinear [0,a]
        .ticks nLabels

    proj = stereonet.projection()
    sel = dip.selectAll 'text'
      .data dipLabels.map(feat)
    sel.enter()
      .append 'text'
      .attr 'class', 'inner'
      .text (d)->d.label
      .attr "transform", (d)->
        v = proj(d.geometry.coordinates)
        "translate(#{v[0]}, #{v[1]}) rotate(#{180-lon})"

    sphereId = "##{stereonet.uid()}-sphere"

    at = {dy: -dy-3, class: 'outer'}
    # Labels
    az.append 'text'
      .attrs at
      .append 'textPath'
        .text 'Azimuth →'
        .attrs
          'xlink:href': sphereId
          startOffset: "#{innerRadius*opts.startOffset*d2r}"
          method: 'stretch'
    dip.append 'text'
      .attrs at
      .append 'textPath'
        .text 'Dip'
        .attrs
          method: 'stretch'
          'xlink:href': sphereId
          startOffset: "#{innerRadius*70*d2r}"
