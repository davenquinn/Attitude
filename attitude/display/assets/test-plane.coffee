d3 = require 'd3'
math = require './math'

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
  deconvolveAxes: (d)->
    # Test javascript deconvolution of axes
    math.deconvolveAxes(d)

fn = modeFunctions[mode]
val = fn(data)

process.stdout.write JSON.stringify(val)

