import * as d3 from 'd3'

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

ellipse = (opts={})->
  # Basic function to create an array
  # of cosines and sines for error-ellipse
  # generation
  opts.n ?= 50
  opts.adaptive = true
  ellAdaptive = (a,b)->
    # Takes major, minor axis lengths
    i_ = 1
    v = opts.n/2
    stepSize = 2/v
    # Make a linearly varying space on the
    # interval [1,-1]
    angles = []

    for i in [0...v]
      sinAngle = -1+i*stepSize
      angles.push [b*Math.cos(Math.asin(sinAngle)),a*sinAngle]

    a1 = angles.slice(1).map ([a,b])->[-a,b]
    a1.reverse()

    # Opposite of first
    return [angles..., [0,a], a1...]

  return ellAdaptive

cart2sph = (opts={})->
  opts.degrees ?= false
  opts.traditionalLayout ?= false
  opts.upperHemisphere ?= true
  c = if opts.degrees then 180/Math.PI else 1
  (d)->
    r = norm(d)

    if opts.traditionalLayout
      [y,z,x] = d
    else
      [y,x,z] = d
      x *= -1
    if not opts.upperHemisphere
      z *= -1
    # Converts xyz to lat lon
    [c*Math.atan2(y,x),c*Math.asin(z/r)]

planeErrors = (axesCovariance, axes, opts={})->
  # Get a single level of planar errors (or the
  # plane's nominal value) as a girdle
  opts.n ?= 100
  opts.upperHemisphere ?= true
  sheet = opts.sheet or 'nominal'
  axes = identity unless axes?
  opts.traditionalLayout ?= true

  s = axesCovariance.map Math.sqrt
  axes = transpose(axes)

  scales =
    upper: 1
    lower: -1
    nominal: 0

  c1 = scales[sheet]
  if opts.upperHemisphere
    c1 *= -1
  # Flip upper and lower rings
  if axes[2][2] < 0
    c1 *= -1

  stepFunc = (a)->
    # Takes an array of [cos(a),sin(a)]
    e = [a[1],
         a[0],
         s[2]*c1]
    (sdot(e,i) for i in axes)

  ell = ellipse opts
  return ell s[0],s[1]
    .map stepFunc
    .map cart2sph(opts)

normalErrors = (axesCovariance, axes, opts={})->
  # Get a single level of planar errors (or the
  # plane's nominal value) as a girdle

  # Should use adaptive resampling
  # https://bl.ocks.org/mbostock/5699934
  opts.n ?= 100
  opts.upperHemisphere ?= true
  opts.traditionalLayout ?= true
  opts.sheet ?= 'upper'
  axes = identity unless axes?
  opts.level ?= 1

  scales = {
    upper: 1
    lower: -1
  }

  s = axesCovariance.map Math.sqrt
  axes = transpose(axes)

  v0 = scales[opts.sheet]
  c1 = 1*v0
  if opts.upperHemisphere
    c1 *= -1
  c1 *= opts.level

  #if axes[2][2] < 0
  #  for i in [0..2]
  #    axes[i] = axes[i].map (d)->d*-1
  #  c1 *= -1

  stepFunc = (es)->
    e = es.map (d,i)->
      -d*c1*s[2]/s[i]
    e.push norm(es)*v0

    (sdot(e,i) for i in axes)

  ell = ellipse(opts)
  ell s[0],s[1]
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

convolveAxes = (axes, sv)->
  # Convolve unit-length principal axes
  # with singular values to form vectors
  # representing the orientation and magnitude
  # of hyperbolic axes
  # In case we don't pass normalized axes
  [residual,axes] = deconvolveAxes(axes)
  axes.map (row,i)->row.map (e)->e*sv[i]

deconvolveAxes = (axes)->
  # Deconvolve unit-length principal axes and
  # singular values from premultiplied principal axes
  # Inverse of `convolveAxes`
  ax = transpose(axes)
  sv = ax.map norm
  for i in [0...axes.length]
    for j in [0...axes.length]
      axes[j][i] /= sv[i]
  [sv,axes]

export {
  norm
  cart2sph
  planeErrors
  normalErrors
  combinedErrors
  transpose
  convolveAxes
  deconvolveAxes
}
