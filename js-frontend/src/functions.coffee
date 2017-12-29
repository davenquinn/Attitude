import {geoArea,select} from 'd3'
import rewind from 'geojson-rewind'
import * as math from './math.coffee'
import {cloneOptions} from './util.coffee'

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
  a = geoArea(f)
  if a > 2*Math.PI
    f = createFeature("Polygon",e.map (d)->d.reverse())
  f.properties ?= {}
  f.properties.area = a
  f

createNominalPlane = (d)->
  createFeature 'LineString', d.nominal

flipAxesIfNeeded = (axes)->
  if axes[2][2] < 0
    axes[2] = axes[2].map (e)-> -e
  return axes

createGroupedPlane = (opts)->
  opts.nominal ?= true

  (p)->
    {hyperbolic_axes, axes, covariance} = p
    # To preserve compatibility
    hyperbolic_axes = covariance if not hyperbolic_axes?

    # Make sure axes are not inverted
    axes = flipAxesIfNeeded(axes)

    e = combinedErrors hyperbolic_axes, axes, opts
    el = select @
    el.append "path"
      .datum createErrorSurface(e)
      .attr 'class', 'error'
    return if not opts.nominal
    # Create nominal plane
    el.append "path"
      .datum createNominalPlane(e)
      .attr 'class', 'nominal'

__createErrorEllipse = (opts)->
  #Function generator to create error ellipse
  #for a single error level
  createEllipse = (p)->
    {hyperbolic_axes, axes, covariance} = p
    # To preserve compatibility
    hyperbolic_axes = covariance if not hyperbolic_axes?
    f_ = (sheet)->
      opts.sheet = sheet
      e = math.normalErrors hyperbolic_axes, axes, opts
      f = createFeature("Polygon", [e])

      # Check winding (note: only an issue with non-traditional
      # stereonet axes)
      a = geoArea(f)
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

export {
  createGroupedPlane as plane
  createErrorSurface as errorSurface
  createNominalPlane as nominalPlane
  createErrorEllipse as errorEllipse
}
