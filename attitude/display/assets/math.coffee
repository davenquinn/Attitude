d3 = require 'd3'

transpose = (array, length=null) ->
  unless length?
    length = array[0].length
  newArray = [0...length].map -> []
  for i in [0...array.length]
    for j in [0...length]
      newArray[j].push array[i][j]
  newArray

 identity = [[1,0,0],[0,1,0],[0,0,1]]

planeErrors = (singularValues, axes, opts={})->
  # Get a single level of planar errors (or the
  # plane's nominal value) as a girdle
  n = opts.n or 100
  upperHemisphere = opts.upperHemisphere or true
  sheet = opts.sheet or 'nominal'
  degrees = opts.degrees or false
  axes = identity unless axes?

  step = 2*Math.PI/(n-1)
  angles = (i*step for i in [0...n])

  s = singularValues.map Math.sqrt
  axes = transpose(axes)

  sdot = (a,b)->
    zipped = (a[i]*b[i] for i in [0..a.length])
    d3.sum zipped

  c = if degrees then 180/Math.PI else 1

  c1 = if axes[2][2] > 0 then 1 else -1

  scales =
    upper: 1
    lower: -1
    nominal: 0

  c1 *= scales[sheet]
  if upperHemisphere
    c1 *= -1

  stepFunc = (angle)->

    e = [Math.cos(angle)*s[0],
         Math.sin(angle)*s[1],
         s[2]*c1]

    d = (sdot(e,i) for i in axes)

    sq = (a)->a*a
    r = Math.sqrt d3.sum d.map(sq)

    [y,z,x] = d

    if not upperHemisphere
      z *= -1

    return [
      c*Math.atan2(y,x),
      c*Math.asin z/r]

  return angles.map(stepFunc)

combinedErrors = (sv, ax, opts={})->
  func = (type)->
    opts.sheet = type
    opts.degrees = true
    planeErrors sv, ax, opts

  out =
    nominal: func('nominal')
    upper: func('upper')
    lower: func('lower')

module.exports =
  planeErrors: planeErrors
  combinedErrors: combinedErrors
  transpose: transpose

