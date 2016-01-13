d3 = require 'd3'
rewind = require 'geojson-rewind'
math = require './math'

combinedErrors = math.combinedErrors

createErrorSurface = (d)->
  # Function that turns orientation
  # objects into error surface
  coords = [d.lower,d.upper]
  data =
    type: 'Feature'
    geometry:
      type: 'Polygon'
      coordinates: coords
  return rewind(data)

createNominalPlane = (d)->
  data =
    type: 'Feature'
    geometry:
      type: 'LineString'
      coordinates: d.nominal
  return data

createGroupedPlane = (color)->
  (d)->
    p = d.properties
    e = combinedErrors p.singularValues, p.axes
    el = d3.select @
    el.append "path"
      .datum createErrorSurface(e)
      .attr
        class: 'error'
        fill: color
        'fill-opacity':0.5

    el.append "path"
      .datum createNominalPlane(e)
      .attr
        class: 'nominal'
        fill: 'none'
        stroke: color

module.exports =
  plane: createGroupedPlane
