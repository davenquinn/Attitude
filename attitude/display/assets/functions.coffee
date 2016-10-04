d3 = require 'd3'
rewind = require 'geojson-rewind'
math = require './math'

combinedErrors = math.combinedErrors

createFeature = (type, coordinates)->
  type: 'Feature'
  geometry:
    type: type
    coordinates: coordinates

createErrorSurface = (d, reversed=false)->
  # Function that turns orientation
  # objects into error surface
  if reversed
    coords = [d.lower,d.upper]
  else
    coords = [d.upper,d.lower]
  data = createFeature "Polygon", coords
  return rewind(data)

createNominalPlane = (d)->
  createFeature 'LineString', d.nominal

createGroupedPlane = (opts)->
  color = opts.color or 'red'
  opacity = opts.opacity or 0.5
  (p)->
    e = combinedErrors p.singularValues, p.axes, opts
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

createErrorEllipse = (opts)->
  color = opts.color or 'purple'
  opacity = opts.opacity or 0.5
  (p)->
    e = math.normalErrors p.singularValues, p.axes, opts
    f = createFeature("Polygon", [e.reverse()])
    el = d3.select @
    el.append "path"
      .datum rewind(f)
      .attr
        class: 'error'
        fill: color
        'fill-opacity': opacity


module.exports =
  plane: createGroupedPlane
  errorSurface: createErrorSurface
  nominalPlane: createNominalPlane
  errorEllipse: createErrorEllipse
