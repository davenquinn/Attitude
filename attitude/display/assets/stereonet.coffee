d3 = require 'd3'
rewind = require 'geojson-rewind'

class Stereonet
  constructor: (el)->
    @width = 500
    @height = @width
    @center = [@width/2, @height/2]

    @projection = d3.geo.azimuthalEquidistant()
      .clipAngle 90-1e-3
      .scale 150
      .translate @center
      .precision .1

    @path = d3.geo.path()
      .projection @projection

    graticule = d3.geo.graticule()

    @svg = d3.select el[0][0]
      .append "svg"
        .attr "viewBox", "0,0,500,500"
        .attr "width", @width
        .attr "height", @height

    @svg.append "path"
      .datum graticule
      .attr class:"graticule", d:@path

    @svg.append "path"
        .datum {type: "Sphere"}
        .attr class:"sphere", d:@path

    @frame = @svg.append 'g'
      .attr class: 'dataFrame'

  addData: (d)->
    coords = [d.upper, d.lower]
    data =
      type: 'Feature'
      geometry:
        type: 'Polygon'
        coordinates: coords
    @frame.append 'path'
      .datum rewind(data)
      .attr
        class: 'data'

    data =
      type: 'Feature'
      geometry:
        type: 'LineString'
        coordinates: d.nominal
    @frame.append 'path'
      .datum data
      .attr
        class: 'nominal'

    @frame.selectAll 'path'
      .attr d: @path

module.exports = Stereonet
