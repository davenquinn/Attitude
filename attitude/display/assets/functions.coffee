d3 = require 'd3'
require 'd3-selection-multi'
rewind = require 'geojson-rewind'
math = require './math'

combinedErrors = math.combinedErrors

createFeature = (type, coordinates)->
  type: 'Feature'
  geometry:
    type: type
    coordinates: coordinates

createErrorSurface = (d)->
  # Function that turns orientation
  # objects into error surface
  e = [d.lower,d.upper.reverse()]

  f = createFeature "Polygon", e
  a = d3.geoArea(f)
  if a > 2*Math.PI
    f = createFeature("Polygon",e.map (d)->d.reverse())
  f.properties ?= {}
  f.properties.area = a
  f

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
      .attrs
        class: 'error'
        fill: color
        'fill-opacity': opacity

    el.append "path"
      .datum createNominalPlane(e)
      .attrs
        class: 'nominal'
        fill: 'none'
        stroke: color

createErrorEllipse = (opts)->
  ##
  #Function generator to create error ellipse
  (p)->
    f_ = (sheet)->
      opts.sheet = sheet
      e = math.normalErrors p.covariance, p.axes, opts
      f = createFeature("Polygon", [e])

      # Check winding (note: only an issue with non-traditional
      # stereonet axes)
      a = d3.geoArea(f)
      if a > 2*Math.PI
        f = createFeature("Polygon",[e.reverse()])
        a = d3.geoArea(f)
      f.properties ?= {}
      f.properties.area = a
      f

    v = ['upper','lower'].map f_
    coords = v.map (d)->d.geometry.coordinates
    f = createFeature "MultiPolygon", coords
    f.properties = v[0].properties
    f

module.exports =
  plane: createGroupedPlane
  errorSurface: createErrorSurface
  nominalPlane: createNominalPlane
  errorEllipse: createErrorEllipse
