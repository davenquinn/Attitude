import * as d3 from 'd3'
import chroma from 'chroma-js'
import {selection, select} from 'd3-selection'
import 'd3-selection-multi'
import * as functions from '../functions.coffee'
import * as math from '../math.coffee'
import style from './module.styl'
import horizontal from './horizontal'
import vertical from './vertical'
import interaction from './interaction.coffee'
import {globalLabels} from './labels.coffee'
import uuid from 'uuid'

export {selection}

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
    if not fn?
      fn = (v)->p=v
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
  uid = uuid.v4()

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
    .pointRadius 2

  # Items to be added once DOM is available
  # (e.g. interaction)
  callStack = []

  drawPlanes = (data, o={})->
    o.color ?= '#aaaaaa'
    if not el?
      throw "Stereonet must be initialized to an element before adding data"
    if not o.selector?
      o.selector = 'g.planes'

    con = dataArea.selectAppend o.selector

    fn = functions.plane opts

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

    if not o.selector?
      o.selector = 'g.poles'
    con = dataArea.selectAppend o.selector

    fn = functions.errorEllipse opts

    createEllipse = (d)->
      d3.select @
        .append 'path'
        .attr 'class', 'error'
        .datum fn(d)

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

    path = d3.geoPath().projection proj

    if el?
      el.attrs height: scale, width: scale

  __redraw = =>
    return unless el?
    el.selectAll 'path'
      .attr 'd', path.pointRadius(2)

  dispatch = d3.dispatch uid+'rotate', uid+'redraw'

  f = (_el, opts={})->
    # This should be integrated into a reusable
    # component
    el = _el

    __setScale() # Scale the stereonet

    sphereId = "##{uid}-sphere"

    el.append "defs"
      .append "path"
        .datum({type: "Sphere"})
        .attrs
          d: path
          id: sphereId.slice(1)

    neatlineId = "##{uid}-neatline-clip"
    el.append "clipPath"
      .attr "id", neatlineId.slice(1)
      .append "use"
      .attr "xlink:href", sphereId

    el.append "use"
      .attrs
        class: 'background'
        'xlink:href': sphereId
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
          "xlink:href": sphereId

      int.attr 'clip-path', "url(#{neatlineId})"

    overlay = el.append "g"
      .attrs class: "overlay"

    for item in callStack
      item()
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

  f.uid = -> uid

  f.refresh = ->__redraw()
  f.rotate = (coords)=>
    unless coords?
      return proj.rotate()
    proj.rotate coords
    dispatch.call uid+'rotate', f
    __redraw()

  f.centerPosition = ->
    centerPos = proj.invert([scale/2,scale/2])


  f.d3 = d3

  f.on = (event,callback)->
    dispatch.on uid+event, callback

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
    todo = -> fn f, args...
    if f.node()?
      todo()
    else
      callStack.push todo
    return f

  ell = ->
    # Same call signature as selection.data
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

  f.call interaction

  return f

opacityByCertainty = (colorFunc, accessor=null)->
  angularError = (d)->d.max_angular_error
  darkenStroke = 0.2
  maxOpacity = 5
  alphaScale = d3.scalePow(4)
    .range [0.8,0.1]
    .domain [0,maxOpacity]
  alphaScale.clamp(true)
  f = (d,i)->
    angError = angularError(d)
    al = alphaScale(angError)

    color = chroma(colorFunc(d))
    fill = color.alpha(al).css()
    stroke = color.alpha(al+darkenStroke).css()

    e = d3.select @
    if accessor?
      e = e.selectAll 'path.error'
    e.attr 'fill', fill
     .attr 'stroke', stroke

  __getSet = getterSetter(f)

  f.angularError = __getSet angularError, (v)->angularError = v
  f.max = __getSet maxOpacity, (v)->maxOpacity=v

  return f

export {
  globalLabels
  Stereonet
  opacityByCertainty
}
