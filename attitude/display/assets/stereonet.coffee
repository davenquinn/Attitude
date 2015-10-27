d3 = require 'd3'
rewind = require 'geojson-rewind'

class Stereonet
  constructor: (el)->
    @width = 500
    @height = @width
    @center = [@width/2, @height/2]

    #d3.geo.azimuthalEquidistant()
    @projection = d3.geo.azimuthalEqualArea()
      .clipAngle 90-1e-3
      .scale 150
      .translate @center
      .precision .1

    @path = d3.geo.path()
      .projection @projection

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

    @svg = d3.select el[0][0]
      .append "svg"
        .attr "viewBox", "0,0,500,500"
        .attr "width", @width
        .attr "height", @height
        .call @drag

    @svg.append "path"
      .datum graticule
      .attr class:"graticule", d:@path

    @svg.append "path"
        .datum {type: "Sphere"}
        .attr class:"sphere", d:@path

    @frame = @svg.append 'g'
      .attr class: 'dataFrame'

  addData: (d, main=true)->
    newClass = if main then 'main' else 'component'
    coords = [d.upper, d.lower]
    data =
      type: 'Feature'
      geometry:
        type: 'Polygon'
        coordinates: coords
    @frame.append 'path'
      .datum rewind(data)
      .attr
        class: "errors #{newClass}"

    data =
      type: 'Feature'
      geometry:
        type: 'LineString'
        coordinates: d.nominal
    @frame.append 'path'
      .datum data
      .attr
        class: "nominal #{newClass}"

  draw: =>
    @frame.selectAll 'path'
      .attr d: @path

module.exports = Stereonet
