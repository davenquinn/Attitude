d3 = require 'd3'
rewind = require 'geojson-rewind'

projections =
  wulff: d3.geoAzimuthalEqualArea
  schmidt: d3.geoAzimuthalEquidistant

selectedRotation = 1
centerPoints = [
  [[0,0],'North']
  [[0,90],'Vertical']
]

class Stereonet
  defaults:
    width: 500
    height: 500
    margin: 0
    projCenter: [0,0]
    traditional: false
  constructor: (el, options={})->
    for k,v of @defaults
      @[k] = options[k] or @defaults[k]
    @center = [@width/2, @height/2]
    @setupProjection()

    @drag = d3.drag()
      .origin =>
        r = @projection.rotate()
        {x: r[0], y: -r[1]}
      .on 'drag', => @reflowProjection [d3.event.x, -d3.event.y]
      .on 'dragstart', (d) ->
        d3.event.sourceEvent.stopPropagation()
        d3.select @
          .classed 'dragging', true
      .on 'dragend', (d) ->
        d3.select @
          .classed 'dragging', false

    graticule = d3.geo.graticule()


    @setCenter = =>
      selectedRotation = if selectedRotation == 1 then 0 else 1
      loc = centerPoints[selectedRotation]
      # Duplicate array
      coords = loc[0].slice()
      coords[1] *= -1 unless @traditional

      @reflowProjection coords
      @topLabel.text loc[1]


    @svg = d3.select el
      .append "svg"
        .attr "width", @width
        .attr "height", @height
        .call @drag
        .on 'click', @setCenter

    @topLabel = @svg.append 'text'
      .attr
        x: 250
        y: 10
        'text-align': 'center'

    @svg.append "path"
      .datum graticule
      .attrs
        class:"graticule",
        d:@path,
        fill: 'none'

    defs = @svg.append "defs"
    defs.append "path"
      .datum {type: "Sphere"}
      .attrs
        id:"sphere",
        d:@path

    defs.append "svg:clipPath"
      .attr id: "clip"
      .append 'use'
        .attr 'xlink:href': '#sphere'

    @frame = @svg.append 'g'
      .attrs
        class: 'dataFrame'
        'clip-path': 'url(#clip)'

    @dataArea = @frame.append 'g'

    @svg.append 'use'
      .attrs
        'xlink:href': '#sphere'
        fill: 'none'
        stroke: 'black'
        'stroke-width': 2

    # Create horizontal
    traditional = false
    if traditional
      coords = [[90,0],[0,90],[-90,0],[0,-90],[90,0]]
    else
      coords = [[0,0],[90,0],[180,0],[-90,0],[0,0]]
    data =
      type: 'Feature'
      geometry:
        type: 'LineString'
        coordinates: coords

    @frame.append 'path'
      .datum data
      .attrs
        class: 'horizontal'
        stroke: 'black'
        'stroke-width': 2
        'stroke-dasharray': '2 4'
        fill: 'none'

    @setCenter()

  reflowProjection: (loc)=>
    @projection.rotate loc
    @svg.selectAll('path').attr d: @path

  setupProjection: (type='wulff')->
    @projectionType = type
    @projection = projections[type]()
      .clipAngle 90-1e-3
      .scale @width/3
      .translate @center
      .precision .1
      #.center @projCenter

    @path = d3.geoPath()
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

  addEllipse: (d,opts)=>
    console.log "Adding ellipse"
    if not opts.class
      opts.class = 'main'
    level = opts.level or 1
    data =
      type: 'Feature'
      geometry:
        type: 'Polygon'
        coordinates: [d]
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
