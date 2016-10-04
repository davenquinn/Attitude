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

norm = (d)->
  # L2 norm (hypotenuse)
  _ = d.map (a)->a*a
  Math.sqrt d3.sum(_)

planeErrors = (singularValues, axes, opts={})->
  # Get a single level of planar errors (or the
  # plane's nominal value) as a girdle
  n = opts.n or 100
  upperHemisphere = opts.upperHemisphere or true
  sheet = opts.sheet or 'nominal'
  degrees = opts.degrees or false
  axes = identity unless axes?
  opts.traditionalLayout ?= true

  step = 2*Math.PI/(n-1)
  angles = (i*step for i in [0...n])

  s = singularValues.map Math.sqrt
  axes = transpose(axes)

  sdot = (a,b)->
    zipped = (a[i]*b[i] for i in [0..a.length])
    d3.sum zipped

  c = if degrees then 180/Math.PI else 1


  scales =
    upper: 1
    lower: -1
    nominal: 0

  c1 = scales[sheet]
  if upperHemisphere
    c1 *= -1
  # Flip upper and lower rings
  if axes[2][2] < 0
    c1 *= -1

  stepFunc = (angle)->

    e = [Math.cos(angle)*s[0],
         Math.sin(angle)*s[1],
         s[2]*c1]

    d = (sdot(e,i) for i in axes)
    r = norm(d)

    if opts.traditionalLayout
      [y,z,x] = d
    else
      [y,x,z] = d
      x *= -1

    if not upperHemisphere
      z *= -1

    return [
      c*Math.atan2(y,x),
      c*Math.asin z/r]

  return angles.map(stepFunc)

normalErrors = (singularValues, axes, opts={})->
  # Get a single level of planar errors (or the
  # plane's nominal value) as a girdle
  n = opts.n or 100
  sheet = opts.sheet or 'nominal'
  degrees = opts.degrees or false
  axes = identity unless axes?
  opts.traditionalLayout ?= true
  upperHemisphere = opts.upperHemisphere or true

  step = 2*Math.PI/(n-1)
  angles = (i*step for i in [0...n])

  v = singularValues.map Math.sqrt
  s = (v[2]/i for i in v)
  axes = transpose(axes)

  sdot = (a,b)->
    zipped = (a[i]*b[i] for i in [0..a.length])
    d3.sum zipped

  c = if degrees then 180/Math.PI else 1

  c1 = 1
  #if upperHemisphere
    #c1 *= -1
  # Flip upper and lower rings
  if axes[2][2] < 0
    c1 *= -1

  stepFunc = (angle)->

    e = [Math.cos(angle)*s[0],
         Math.sin(angle)*s[1],
         s[2]*c1]

    d = (sdot(e,i) for i in axes)
    r = norm(d)

    if opts.traditionalLayout
      [y,z,x] = d
    else
      [y,x,z] = d
      x *= -1

    if not upperHemisphere
      z *= -1

    return [
      c*Math.atan2(y,x),
      c*Math.asin z/r]

  angles.map(stepFunc)

combinedErrors = (sv, ax, opts={})->
  func = (type)->
    opts.sheet = type
    opts.degrees = true
    planeErrors sv, ax, opts

  out =
    nominal: func('nominal')
    upper: func('upper')
    lower: func('lower')

deconvolveAxes = (axes)->
  # Deconvolve unit-length principal axes and
  # singular values from premultiplied principal axes
  ax = transpose(axes)
  sv = ax.map norm
  for i in [0...axes.length]
    for j in [0...axes.length]
      axes[j][i] /= sv[i]
  [sv,axes]

module.exports =
  planeErrors: planeErrors
  normalErrors: normalErrors
  combinedErrors: combinedErrors
  transpose: transpose
  deconvolveAxes: deconvolveAxes

