d3 = require 'd3'
rewind = require 'geojson-rewind'

projections =
  wulff: d3.geo.azimuthalEqualArea
  schmidt: d3.geo.azimuthalEquidistant

class Stereonet
  constructor: (el)->
    @width = 500
    @height = @width
    @center = [@width/2, @height/2]

    @setupProjection()

    @drag = d3.behavior.drag()
      .origin =>
        r = @projection.rotate()
        {x: r[0], y: -r[1]}
      .on 'drag', =>
        @projection.rotate [d3.event.x, -d3.event.y]
        @svg.selectAll('path').attr d: @path
      .on 'dragstart', (d) ->
        d3.event.sourceEvent.stopPropagation()
        d3.select @
          .classed 'dragging', true
      .on 'dragend', (d) ->
        d3.select @
          .classed 'dragging', false

    graticule = d3.geo.graticule()

    @svg = d3.select el
      .append "svg"
        .attr "viewBox", "0,0,500,500"
        .attr "width", @width
        .attr "height", @height
        .call @drag

    @svg.append "path"
      .datum graticule
      .attr class:"graticule", d:@path

    defs = @svg.append "defs"
    defs.append "path"
      .datum {type: "Sphere"}
      .attr
        id:"sphere",
        d:@path

    defs.append "svg:clipPath"
      .attr id: "clip"
      .append 'use'
        .attr 'xlink:href': '#sphere'

    @frame = @svg.append 'g'
      .attr
        class: 'dataFrame'
        'clip-path': 'url(#clip)'

    @dataArea = @frame.append 'g'

    @svg.append 'use'
      .attr
        'xlink:href': '#sphere'
        fill: 'none'
        stroke: 'black'
        'stroke-width': 2

    # Create horizontal
    data =
      type: 'Feature'
      geometry:
        type: 'LineString'
        coordinates: [[90,0],[0,90],[-90,0],[0,-90],[90,0]]

    @frame.append 'path'
      .datum data
      .attr
        class: 'horizontal'
        stroke: 'black'
        'stroke-width': 2
        'stroke-dasharray': '2 4'
        fill: 'none'

  setupProjection: (type='wulff')->
    @projectionType = type
    @projection = projections[type]()
      .clipAngle 90-1e-3
      .scale 150
      .translate @center
      .precision .1

    @path = d3.geo.path()
      .projection @projection

  addGirdle: (d, opts)=>
    if not opts.class?
      opts.class = 'main'
    level = opts.level or 1

    coords = [d.upper, d.lower]
    data =
      type: 'Feature'
      geometry:
        type: 'Polygon'
        coordinates: coords
    @dataArea.append 'path'
      .datum rewind(data)
      .attr
        class: "errors #{opts.class}"
        'fill-opacity': Math.pow(1/(level*2),1.5)

  addPath: (d,opts)=>
    if not opts.class?
      opts.class = 'main'
    data =
      type: 'Feature'
      geometry:
        type: 'LineString'
        coordinates: d
    @dataArea.append 'path'
      .datum data
      .attr
        class: "nominal #{opts.class}"

  draw: =>
    @frame.selectAll 'path'
      .attr d: @path

module.exports = Stereonet
