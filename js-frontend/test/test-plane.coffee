d3 = require 'd3'
turf = require 'turf'
window = null
{errorSurface,nominalPlane, math} = require '../lib/attitude.js'

# Test implementations of plane functions in javascript
mode = process.argv[2]
obj = process.argv[3]

data = JSON.parse(obj)

mappable = (fn)->
  (data)->data.map(fn)

# Run different function depending on mode
modeFunctions =
  individual: mappable (d)->
      math.planeErrors d.singularValues, d.axes, d
  grouped: mappable (d)->
      math.combinedErrors d.singularValues, d.axes, d
  ellipse: mappable (d)->
      math.normalErrors d.singularValues, d.axes, d
  deconvolveAxes: (d)->
    # Test javascript deconvolution of axes
    math.deconvolveAxes(d)
  intersection: (d)->
    # Test that nominal plane is within
    # error bounds
    axs = math.deconvolveAxes d
    e = math.combinedErrors.apply null, axs
    polygon = errorSurface e
    line = nominalPlane e
    points = line.geometry.coordinates.map (d)->
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: d
        }
      }

    pt = points[0]
    ins = turf.inside pt, polygon
    return ins

fn = modeFunctions[mode]
val = fn(data)

process.stdout.write JSON.stringify(val)

