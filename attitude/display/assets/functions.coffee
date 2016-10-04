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
    e = combinedErrors p.covariance, p.axes, opts
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
  ##
  #Function generator to create error ellipse
  (p)->
    e = math.normalErrors p.covariance, p.axes, opts
    f = createFeature("Polygon", [e])
    rewind(f)

module.exports =
  plane: createGroupedPlane
  errorSurface: createErrorSurface
  nominalPlane: createNominalPlane
  errorEllipse: createErrorEllipse
