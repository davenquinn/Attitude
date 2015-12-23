d3 = require 'd3'
rewind = require 'geojson-rewind'
math = require './math'

planeErrors = math.planeErrors

createErrorSurface = (d)->
  # Function that turns orientation
  # objects into error surface
  p = d.properties

  # Switch hemispheres if PCA is upside-down
  u = 'upper'
  l = 'lower'
  if p.singularValues[2] < 0
      v = [l,u]
  else
      v = [u,l]

  coords = v.map (i)->
    planeErrors p.singularValues, p.axes,
      sheet:i, degrees: true
  data =
    type: 'Feature'
    id: d.id
    geometry:
      type: 'Polygon'
      coordinates: coords
  return rewind(data)

createNominalPlane = (d)->
  p = d.properties
  coords = planeErrors p.singularValues, p.axes,
    sheet: 'nominal', degrees: true
  data =
    type: 'Feature'
    id: d.id
    geometry:
      type: 'LineString'
      coordinates: coords
  return data

createGroupedPlane = (color)->
  (d)->
    el = d3.select @
    el.append "path"
      .datum createErrorSurface(d)
      .attr
        class: 'error'
        fill: color
        'fill-opacity':0.5

    el.append "path"
      .datum createNominalPlane(d)
      .attr
        class: 'nominal'
        fill: 'none'
        stroke: color

module.exports =
  plane: createGroupedPlane
