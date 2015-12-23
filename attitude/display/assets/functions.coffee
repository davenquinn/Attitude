d3 = require 'd3'
rewind = require 'geojson-rewind'

createErrorSurface = (d)->
  # Function that turns orientation
  # objects into error surface
  e = d.properties.error_coords
  coords = [e.upper, e.lower]
  data =
    type: 'Feature'
    id: d.id
    geometry:
      type: 'Polygon'
      coordinates: coords
  return rewind(data)

createNominalPlane = (d)->
  e = d.properties.error_coords
  data =
    type: 'Feature'
    id: d.id
    geometry:
      type: 'LineString'
      coordinates: e.nominal
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
