d3 = require 'd3'
math = require './math'

# Test implementations of plane functions in javascript
mode = process.argv[2]
obj = process.argv[3]

data = JSON.parse(obj)

# Run different function depending on mode
modeFunctions =
  individual: (d)->
    math.planeErrors d.singularValues, d.axes, d
  grouped: (d)->
    math.combinedErrors d.singularValues, d.axes, d
  #deconvolve_axes: (d)->
    ## Test javascript deconvolution of axes
    #sv, ax = math.deconvolveAxes(d)

fn = modeFunctions[mode]
val = data.map fn

process.stdout.write JSON.stringify(val)

