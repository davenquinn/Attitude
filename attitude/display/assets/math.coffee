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

sdot = (a,b)->
  zipped = (a[i]*b[i] for i in [0..a.length])
  d3.sum zipped

ellipse = (n)->
  # Basic function to create an array
  # of cosines and sines for error-ellipse
  # generation
  step = 2*Math.PI/(n-1)
  angles = (i*step for i in [0...n])
  ([Math.cos(a),Math.sin(a)] for a in angles)

cart2sph = (opts)->
  opts.degrees ?= false
  c = if opts.degrees then 180/Math.PI else 1
  (d)->
    r = norm(d)
    [x,y,z] = d
    # Converts xyz to lat lon
    [c*Math.atan2(y,x),c*Math.asin(z/r)]

planeErrors = (axesCovariance, axes, opts={})->
  # Get a single level of planar errors (or the
  # plane's nominal value) as a girdle
  opts.n ?= 100
  upperHemisphere = opts.upperHemisphere or true
  sheet = opts.sheet or 'nominal'
  axes = identity unless axes?
  opts.traditionalLayout ?= true

  ell = ellipse(opts.n)

  s = axesCovariance.map Math.sqrt
  axes = transpose(axes)

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

  stepFunc = (a)->
    # Takes an array of [cos(a),sin(a)]

    e = [a[0]*s[0],
         a[1]*s[1],
         s[2]*c1]

    d = (sdot(e,i) for i in axes)

    [y,z,x] = d

    if not upperHemisphere
      z *= -1

    [x,y,z]

  return ell
    .map stepFunc
    .map cart2sph(opts)

normalErrors = (axesCovariance, axes, opts={})->
  # Get a single level of planar errors (or the
  # plane's nominal value) as a girdle

  # Should use adaptive resampling
  # https://bl.ocks.org/mbostock/5699934
  opts.n ?= 1000
  upperHemisphere = opts.upperHemisphere or true
  opts.traditionalLayout ?= true
  sheet = opts.sheet or 'nominal'
  axes = identity unless axes?

  ell = ellipse(opts.n)

  s = axesCovariance.map Math.sqrt
  axes = transpose(axes)

  c1 = 1
  if upperHemisphere
    c1 *= -1

  if axes[2][2] < 0
    for i in [0..2]
      axes[i] = axes[i].map (d)->d*-1
    #c1 *= -1

  stepFunc = (es)->

    f = es.map (d,i)->d*s[i]
    e = es.map (i)->
      -i*c1*s[2]
    e.push norm(f)

    d = (sdot(e,i) for i in axes)

    if opts.traditionalLayout
      [y,z,x] = d
    else
      [y,x,z] = d
      x *= -1

    if not upperHemisphere
      z *= -1

    return [x,y,z]

   ell
    .map stepFunc
    .map cart2sph(opts)

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

