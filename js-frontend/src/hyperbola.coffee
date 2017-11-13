M = require 'mathjs'
Q = require 'quaternion'
d3 = require 'd3'
require 'd3-jetpack'
import chroma from 'chroma-js'
import * as math from './math.coffee'
import {opacityByCertainty} from './stereonet'
import uuid from 'uuid'

fixAngle = (a)->
  # Put an angle on the interval [-Pi,Pi]
  while a > Math.PI
    a -= 2*Math.PI
  while a < -Math.PI
    a += 2*Math.PI
  return a

## Matrix to map down to 2 dimensions
T = M.matrix [[1,0],[0,0],[0,1]]

matrix = (obj)->
  if obj instanceof Q
    ## We're dealing with a quaternion,
    # need to convert to rotation matrix
    obj = obj.toMatrix(true)
  M.matrix(obj)

dot = (...args)->
  # Multiply matrices, ensuring matrix form
  M.multiply args.map(matrix)...

transpose = (m)->M.transpose matrix m

vecAngle = (a0,a1)->
  a0_ = M.divide(a0,M.norm(a0))
  a1_ = M.divide(a1,M.norm(a1))
  return dot(a0_,a1_)

fixAngle = (a)->
  # Put an angle on the interval [-Pi,Pi]
  while a > Math.PI
    a -= 2*Math.PI
  while a < -Math.PI
    a += 2*Math.PI
  return a

apparentDipCorrection = (screenRatio=1)->
  (axes2d)->
    # Correct for apparent dip
    a0 = axes2d[1]
    a1 = [0,1]
    #a0 = M.divide(a0,M.norm(a0))
    #a1 = M.divide(a1,M.norm(a1))
    cosA = dot(a0,a1)
    console.log "Axes",a0, cosA
    angle = Math.atan2(
      Math.tan(Math.acos(cosA/(M.norm(a0)*M.norm(a1))))
      screenRatio)
    return angle*180/Math.PI

hyperbolicErrors = (viewpoint, axes, lineGenerator, xScale,yScale)->
  n = 10
  angle = viewpoint
  gradient = null
  width = 400

  ratioX = xScale(1)-xScale(0)
  ratioY = yScale(1)-yScale(0)
  screenRatio = Math.abs(ratioX)/ratioY

  internalLineGenerator = d3.line()
    .x (d)->d[0]*ratioX
    .y (d)->d[1]*ratioY

  dfunc = (d)->
    # Get a single level of planar errors (or the
    # plane's nominal value) as a girdle
    rax = d.axes
    if rax[2][2] < 0
      rax = rax.map (row)->row.map (i)->-i

    q = Q.fromAxisAngle [0,0,1], angle+Math.PI

    R = matrix(axes)
    ax = dot(M.transpose(R), d.axes, R)
    a0 = ax.toArray()[0]
    q1 = Q.fromBetweenVectors [1,0,0], [a0[0],a0[1],0]
    a1 = M.acos(vecAngle([a0[0],a0[1],0],[1,0,0]))

    ## Matrix to map down to 2 dimensions
    T = M.matrix [[1,0],[0,0],[0,1]]

    ### Project axes to 2d ###
    s = M.sqrt(d.lengths).map (d)->1/d
    v = [s[0]*Math.cos(angle - a1)
         s[1]*Math.sin(angle - a1)
         s[2]]
    a = 1/M.norm([v[0],v[1]])
    b = 1/M.abs(v[2])
    #if b > a
    #  [a,b] = [b,a]
    #console.log a,b

    #a = M.norm([e[0],e[1]])
    #b = e[2]

    # Major axes of the conic sliced in the requested viewing
    # geometry
    # Semiaxes of hyperbola
    cutAngle = Math.atan2(b,a)
    angularError = cutAngle*2*180/Math.PI
    #console.log "Error: ", angularError
    # find length at which tangent is x long
    lengthShown = width/2
    inPlaneLength = lengthShown*b/a/screenRatio

    #angles = [0...n].map (d)->
      #cutAngle+(d/n*(Math.PI-cutAngle))+Math.PI/2

    ## We will transform with svg functions
    ## so we can neglect some of the math
    # for doing hyperbolae not aligned with the
    # coordinate plane.

    #arr = transpose [
      #M.multiply(M.tan(angles),a)
      #M.cos(angles).map (v)->b/v
    #]
    #sign = if arr.get([0,1]) < 0 then -1 else 1

    largeNumber = width/ratioX
    limit = b/a*largeNumber

    coords  = [
      [-largeNumber,limit]
      [0,b]
      [largeNumber,limit]
    ]
    #coords.push [-largeNumber,limit]

    #__angles = [M.cos(a),M.sin(a)]
    #for c in coords
      #c[0] *= __angles[0]
      #c[1] *= __angles[1]

    # Correction for angle and means go here
    # unless managed by SVG transforms
    top = coords.map ([x,y])->[x,-y]
    top.reverse()

    poly = coords.concat top

    # Translate
    offs = dot(d.offset,R,q).toArray()
    center = [xScale(offs[0])-xScale(0),yScale(offs[2])-yScale(0)]
    # Used for positioning, but later
    d.__z = offs[1]

    oa = opacityByCertainty(->d.color)
      .angularError -> angularError
      .max 5

    # Correct for apparent dip
    apparent = apparentDipCorrection(screenRatio)

    #RQ =  dot(R,q1,q,T)
    # grouped transform
    v = d.apparentDip(-angle+Math.PI/2)*180/Math.PI
    #if aT[1][0]*aT[1][1] < 0
      #__angle *= -1
    #console.log 'Angle', __angle
    #__angle = 0
    ## Start DOM manipulation ###
    hyp = d3.select(@)
      .attr 'transform', "translate(#{-center[0]+xScale(0)},#{yScale(0)+center[1]})
                          rotate(#{v})"

    hyp.classed 'in_group', d.in_group

    lim = width/2
    masksz = {x:-lim,y:-lim,width:lim*2,height:lim*2}

    mask = hyp.select('mask')
    mid = null
    if not mask.node()
      mid = uuid.v4()
      mask = hyp.append 'mask'
        .attr 'id', mid
        .attrs masksz
        .append 'rect'
        .attrs {masksz..., fill: "url(#gradient)"}
    if not mid?
      mid = mask.attr('id')

    hyp.selectAppend 'circle'
      .attrs r: 2, fill: 'black'

    hyp.selectAppend 'path.hyperbola'
      .datum poly
      .attr 'd', (v)->internalLineGenerator(v)+"Z"
      .each oa
      .attr 'mask', "url(##{mid})"

    hyp.on 'click', (d)->
      hyp.select 'path.hyperbola'
        .attr 'opacity', 1

  dfunc.setupGradient = (el)->
    defs = el.append 'defs'

    g = defs.append 'linearGradient'
        .attr 'id', 'gradient'

    stop = (ofs, op)->
      g.append 'stop'
       .attrs offset: ofs, 'stop-color': 'white', 'stop-opacity': op

    stop(0,0)
    stop(0.2,0.1)
    stop(0.45,1)
    stop(0.55,1)
    stop(0.8,0.9)
    stop(1,0)

  return dfunc

digitizedLine = (viewpoint, axes=M.eye(3))->(d)->
  angle = viewpoint
  ### Create a line from input points ###
  ### Put in axis-aligned coordinates ###
  q = Q.fromAxisAngle [0,0,1], angle

  R = M.transpose matrix(axes)
  alignedWithGroup = dot(d.centered, R)
  offs = dot(d.offset,R)
  v = alignedWithGroup.toArray()
    .map (row)-> M.add(row,offs)

  #R2 = q.mul(A).mul(N)
  a = dot(v, q)

  ### Map down to two dimensions (the x-z plane of the viewing geometry) ###
  dot(a, T).toArray()

apparentDip = (viewpoint, axes, lineGenerator, xScale, yScale)->
  #if not axes?
  axes = M.eye(3)
  calculate = (d)->
    angle = viewpoint
    ### Create a line from input points ###
    ### Put in axis-aligned coordinates ###
    q = Q.fromAxisAngle [0,0,1], angle

    qA = Q.fromAxisAngle [0,0,1], -angle

    planeAxes = d.axes
    #if d.group?
    #  planeAxes = d.group.axes

    R = M.transpose matrix(axes)
    A = M.transpose matrix(planeAxes)
    v = dot(d.centered, R, A)
    offs = dot(d.offset,R,q).toArray()
    center = [xScale(offs[0])-xScale(0),yScale(offs[2])-yScale(0)]

    ### Apparent dip correction ###
    lineData = dot(v, T).toArray()

    v = d.apparentDip(-viewpoint+Math.PI/2)*180/Math.PI
    d3.select @
      .attr 'd',lineGenerator(lineData)
      .attr 'transform', "translate(#{-center[0]+xScale(0)},#{yScale(0)+center[1]})
                          rotate(#{v})"

class PlaneData
  constructor: (data, mean=null)->
    {axes, hyperbolic_axes, extracted, color} = data
    @mean = mean
    @axes = data.axes
    @color = color
    @lengths = hyperbolic_axes
    @in_group = data.in_group
    @array = extracted
    @data = data
    #@pcaAxes = math.convolveAxes @axes, @lengths
    # If we didn't pass a mean, we have to compute one
    return unless @array?
    ## Extract mean of data on each axis ##
    @mean = [0..2].map (i)=> d3.mean @array, (d)->d[i]
    @centered = @array.map (d)=>M.subtract(d,@mean)

  dip: =>
    n = @axes[2]
    r = M.norm(n)
    dip = M.acos(n[2]/r)
    dipDr = fixAngle(Math.atan2(n[0],n[1]))
    return [dip,dipDr]

  apparentDip: (azimuth)=>
    n = @axes[2]
    r = M.norm(n)
    [dip,dipDr] = @dip()
    dipDr = Math.atan2(n[0],n[1])
    a = fixAngle(azimuth-dipDr)
    sign = if -Math.PI/2 < a or Math.PI/2 > a then 1 else -1
    d = M.tan(dip)*M.cos(azimuth-dipDr)
    sign*Math.atan(d)

export {hyperbolicErrors, digitizedLine, PlaneData, fixAngle, apparentDip}

