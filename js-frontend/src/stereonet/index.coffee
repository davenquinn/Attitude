d3 = require 'd3'
chroma = require 'chroma-js'
require 'd3-selection-multi'
import * as functions from '../functions.coffee'
import * as math from '../math.coffee'
import style from './module.styl'
import horizontal from './horizontal'
import vertical from './vertical'

opts =
  degrees: true
  traditionalLayout: false
  adaptive: false
  n: 200 # Bug if we go over 60?
  level: 1 # 95% ci for 3 degrees of freedom

getterSetter = (main)->
  (p, fn)->
    # A generic wrapper
    # to get/set variables
    ->
      if arguments.length > 0
        fn(arguments...)
        return main
      else
        return p()

Stereonet = ->
  planes = null
  ellipses = null
  data = null
  el = null
  dataArea = null
  overlay = null
  margin = 20
  scale = 300
  clipAngle = 90
  s = 0.00001
  shouldClip = true

  graticule = d3.geoGraticule()
    .stepMinor [10,10]
    .stepMajor [90,10]
    .extentMinor [[-180,-80-s],[180,80+s]]
    .extentMajor [[-180,-90+s],[180,90-s]]

  proj = d3.geoOrthographic()
    .clipAngle clipAngle
    .precision 0.01
    .rotate [0,0]
    .scale 300

  path = d3.geoPath()
    .projection proj

  drawPlanes = (data, o={})->
    o.color ?= '#aaaaaa'
    if not el?
      throw "Stereonet must be initialized to an element before adding data"

    fn = functions.plane opts

    con = dataArea.append 'g'
      .attr 'class','planes'

    sel = con.selectAll 'g.plane'
          .data data
          .enter()
            .append 'g'
            .classed 'plane', true
            .each fn
            .each (d)->
              if typeof(o.color)=='function'
                color = o.color(d)
              else
                color = o.color
              e = d3.select @
              e.selectAll 'path.error'
                .attrs fill: color
              e.selectAll 'path.nominal'
                .attrs stroke: chroma(color).darken(.2).css()

    __redraw()
    return sel

  drawEllipses = (data, o={})->
    o.color ?= '#aaaaaa'
    if not el?
      throw "Stereonet must be initialized to an element before adding data"

    fn = functions.errorEllipse opts

    createEllipse = (d)->
      d3.select @
        .append 'path'
        .attr 'class', 'error'
        .datum fn(d)

    con = dataArea.append 'g'
      .attr 'class','normal-vectors'

    sel = con.selectAll 'g.normal'
      .data data
        .enter()
        .append 'g'
        .classed 'normal', true
        .each createEllipse

    sel.each (d)->
      if typeof(o.color)=='function'
        color = o.color(d)
      else
        color = o.color
      e = d3.select @
        .selectAll 'path.error'
        .attrs fill: color
    __redraw()
    return sel

  __setScale = (n)->
    # Scale the stereonet to an appropriate size
    scale = n if n?
    radius = scale/2-margin
    if clipAngle < 89
      _pscale = radius/Math.sin(Math.PI/180*clipAngle)
      if shouldClip
        proj.clipAngle clipAngle
      proj
        .scale _pscale
        .translate [scale/2, scale/2]
    else
      proj
        .scale radius
        .translate [scale/2, scale/2]

    path = d3.geoPath()
      .projection proj

    if el?
      el.attrs height: scale, width: scale

  __redraw = =>
    return unless el?
    el.selectAll 'path'
      .attr 'd', path

  dispatch = d3.dispatch 'rotate', 'redraw'

  f = (_el, opts={})->
    # This should be integrated into a reusable
    # component
    el = _el

    __setScale() # Scale the stereonet


    el.append "defs"
      .append "path"
        .datum({type: "Sphere"})
        .attrs
          d: path
          id: "sphere"

    el.append "clipPath"
      .attr "id", "neatline-clip"
      .append "use"
      .attr "xlink:href", "#sphere"

    el.append "use"
      .attrs
        class: 'background'
        fill: 'white'
        stroke: '#aaaaaa'


    int = el.append 'g'
      .attrs
        class: 'interior'

    int.append 'path'
      .datum graticule
      .attrs
        class: 'graticule'
        d: path

    dataArea = int.append 'g'
      .attrs class: 'data'

    if shouldClip
      el.append "use"
        .attrs
          class: 'neatline'
          "xlink:href": "#sphere"

      int.attr 'clip-path', "url(#neatline-clip)"

    overlay = el.append "g"
      .attrs class: "overlay"

    # Add dragging for debug purposes
    drag = d3.drag()
      .on 'drag', =>
        proj.rotate [-d3.event.x, -d3.event.y]
        dispatch.call 'rotate', f
        __redraw()
    el.call drag

    # Finally, draw all the paths at once
    __redraw()

  __getSet = getterSetter(f)
  # Getter-setter for data
  f.data = __getSet(
    -> data
    (o)=>data = o)
  f.node = ->el
  f.margin = __getSet(
    ->margin
    (o)=>margin = o)
  f.size = __getSet(
    ->scale,
    __setScale)
  f.innerSize = ->scale-margin
  f.projection = ->proj
  f.clip = __getSet(
    ->shouldClip
    (c)->shouldClip=c
  )

  f.on = (event,callback)->
    dispatch.on event, callback

  setGraticule = (lon, lat)->
    ## Could also make this take a d3.geoGraticule object ##
    s = 0.00001
    graticule = d3.geoGraticule()
        .stepMinor [lon,lat]
        .stepMajor [90,lat]
        .extentMinor [[-180,-90+lat-s],[180,90-lat+s]]
        .extentMajor [[-180,-90+s],[180,90-s]]

  f.graticule = __getSet(
    ->graticule,
    setGraticule)

  _ = (c)->
    if c == 'vertical'
      c = [0,90]
    proj.rotate(c)
    __redraw() if el?
  f.center = __getSet(
    ->proj.rotate
    _)

  _ = (c)->
    clipAngle = c
    proj.rotate [0,-90]
    __setScale()
    return f
  f.clipAngle = __getSet(
    ->clipAngle
    _)
  f.planes = drawPlanes
  f.draw = __redraw

  f.path = -> path

  f.call = (fn, ...args)->
    fn f, args...
    return f

  ell = ->
    # Same call signature as d3.Selection.data
    attrs = null
    data_ = null
    sel = null
    fn = null
    o = (el_)->
      ell = functions.errorEllipse opts
      sel = ->
        el_.selectAll 'path.ellipse'
          .data data_.map(ell), fn

      sel()
        .enter()
          .append 'path'
            .attr 'class', "ellipse"
            .attrs attrs
        .exit()
          .remove()

      __redraw() if el?
      return sel

    __getSet = getterSetter(o)

    o.data = __getSet data_,(d,f)->
      data_ = d
      fn = f

    o.attrs = __getSet attrs, (o)->
      attrs=o
      if sel?
        sel().attrs attrs

    o.selection = sel
    return o

  f.ellipses = drawEllipses
  f.dataArea = -> dataArea
  f.overlay = -> overlay
  f.horizontal = horizontal(f)
  f.vertical = vertical(f)

  return f

opacityByCertainty = (colorFunc)->
  darkenStroke = 0.2
  (d,i)->
    e = d3.select @

    alphaScale = d3.scaleLinear()
      .range [0.8,0.1]
      .domain [0,5]
    alphaScale.clamp(true)

    al = alphaScale(d.max_angular_error)

    color = chroma(colorFunc(d))
    fill = color.alpha(al).css()
    stroke = color.alpha(al+darkenStroke).css()

    v = e.selectAll 'path.error'
      .attrs {fill, stroke}

import positionLabels from './labels.coffee'
export {
  positionLabels
  Stereonet
  opacityByCertainty
}
