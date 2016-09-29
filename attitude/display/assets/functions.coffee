d3 = require 'd3'
rewind = require 'geojson-rewind'
math = require './math'

combinedErrors = math.combinedErrors

createErrorSurface = (d, reversed=false)->
  # Function that turns orientation
  # objects into error surface
  if reversed
    coords = [d.lower,d.upper]
  else
    coords = [d.upper,d.lower]
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

createGroupedPlane = (opts)->
  color = opts.color or 'red'
  opacity = opts.opacity or 0.5
  (p)->
    e = combinedErrors p.singularValues, p.axes
    el = d3.select @
    el.append "path"
      .datum createErrorSurface(e)
      .attr
        class: 'error'
        fill: color
        'fill-opacity': opacity

    el.append "path"
      .datum createNominalPlane(e)
      .attr
        class: 'nominal'
        fill: 'none'
        stroke: color

module.exports =
  plane: createGroupedPlane
  errorSurface: createErrorSurface
  nominalPlane: createNominalPlane
