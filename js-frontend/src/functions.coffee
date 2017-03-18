d3 = require 'd3'
require 'd3-selection-multi'
rewind = require 'geojson-rewind'
math = require './math'
{cloneOptions} = require './util'

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
  opts.nominal ?= true

  (p)->
    e = combinedErrors p.covariance, p.axes, opts
    el = d3.select @
    el.append "path"
      .datum createErrorSurface(e)
      .attrs
        class: 'error'
    return if not opts.nominal
    el.append "path"
      .datum createNominalPlane(e)
      .attrs
        class: 'nominal'

__createErrorEllipse = (opts)->
  #Function generator to create error ellipse
  #for a single error level
  createEllipse = (p)->
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
      f.properties =
        area: a
        level: opts.level
        sheet: sheet
      f

    v = ['upper','lower'].map f_
    coords = v.map (d)->d.geometry.coordinates
    f = createFeature "MultiPolygon", coords
    f.properties = v[0].properties
    f

createErrorEllipse = (opts)->
  # Level can be single or array of error levels
  opts.level ?= 1
  levels = opts.level

  __fnAtLevel = (l)->
    o1 = cloneOptions opts, level: l
    __createErrorEllipse o1

  if Array.isArray levels
    # Return an array of functions, one for each
    # level of the ellipse to be generated
    return levels.map __fnAtLevel
  else
    # Return a single function for the specified
    # level
    return __fnAtLevel(levels)

module.exports =
  plane: createGroupedPlane
  errorSurface: createErrorSurface
  nominalPlane: createNominalPlane
  errorEllipse: createErrorEllipse
