M = require 'mathjs'
Q = require 'quaternion'
d3 = require 'd3'
require 'd3-jetpack'
import chroma from 'chroma-js'
import * as math from './math.coffee'
import {opacityByCertainty} from './stereonet'
import uuid from 'uuid'

gradientHelper = (defs, color='white', uid='gradient')->
  g = defs.append 'linearGradient'
      .attr 'id', uid

  stop = (ofs, op)->
    g.append 'stop'
     .attrs offset: ofs, 'stop-color': color, 'stop-opacity': op

  stop(0,0)
  stop(0.2,0.1)
  stop(0.45,1)
  stop(0.55,1)
  stop(0.8,0.1)
  stop(1,0)

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

scaleRatio = (scale)->
  scale(1)-scale(0)

getRatios = (x,y)->
  # Ratios for x and y axes
  ratioX = scaleRatio(x)
  ratioY = scaleRatio(y)
  screenRatio = ratioX/ratioY

  lineGenerator = d3.line()
    .x (d)->d[0]*ratioX
    .y (d)->d[1]*ratioY

  {ratioX, ratioY, screenRatio, lineGenerator}

__planeAngle = (axes, angle)->
  # Get angle of the plane from the major axes
  a0 = axes.toArray()[0]
  angle - M.acos(vecAngle([a0[0],a0[1],0],[1,0,0]))

hyperbolicErrors = (viewpoint, axes, xScale,yScale)->
  n = 10
  angle = viewpoint
  gradient = null
  width = 400
  nominal = false
  centerPoint = false

  # For 3 coordinates on each half of the hyperbola, we collapse down to
  # a special case where no trigonometry outside of tangents have to be calculated
  # at each step. This is much more efficient, at the cost of the fine structure
  # of the hyperbola near the origin
  nCoords = 3
  {ratioX,ratioY,screenRatio, lineGenerator} = getRatios(xScale, yScale)

  dfunc = (d)->
    # Get a single level of planar errors (or the
    # plane's nominal value) as a girdle
    rax = d.axes
    if rax[2][2] < 0
      rax = rax.map (row)->row.map (i)->-i

    q = Q.fromAxisAngle [0,0,1], angle+Math.PI

    R = matrix(axes)
    ax = dot(M.transpose(R), d.axes, R)
    a1 = __planeAngle(ax,angle)

    ## Matrix to map down to 2 dimensions
    T = M.matrix [[1,0],[0,0],[0,1]]

    ### Project axes to 2d ###
    s = M.sqrt(d.lengths).map (d)->1/d
    v = [s[0]*Math.cos(a1)
         s[1]*Math.sin(a1)
         s[2]]
    a = 1/M.norm([v[0],v[1]])
    b = 1/M.abs(v[2])

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

    cutAngle2 = Math.atan2(b,a*screenRatio)

    inPlaneLength = Math.abs(lengthShown * Math.cos cutAngle2)

    ## We will transform with svg functions
    ## so we can neglect some of the math
    # for hyperbolae not aligned with the
    # coordinate plane.
    if nCoords > 3
      angles = [0...n].map (d)->
        cutAngle+(d/n*(Math.PI-cutAngle))+Math.PI/2

      arr = transpose [
        M.multiply(M.tan(angles),a)
        M.cos(angles).map (v)->b/v
      ]
    else
      arr = [[0,b]]

    largeNumber = width/ratioX
    limit = b/a*largeNumber

    coords  = [
      [-largeNumber,limit]
      arr...
      [largeNumber,limit]
    ]

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
    #apparent = apparentDipCorrection(screenRatio)

    # grouped transform
    v = d.apparentDip(-angle+Math.PI/2)
    v = -Math.atan2(Math.tan(v),screenRatio)*180/Math.PI
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
    lim = Math.abs inPlaneLength
    masksz = {x:-lim,y:-lim,width:lim*2,height:lim*2}

    mask = hyp.select('defs')
    mid = null
    if not mask.node()
      mid = uuid.v4()
      mask = hyp.append 'defs'
        .call gradientHelper, d.color, mid
    if not mid?
      mid = mask.attr('id')

    if centerPoint
      hyp.selectAppend 'circle'
        .attrs r: 2, fill: 'black'

    sfn = d3.scalePow(2)
      .domain [0,5]
      .range [1,0.2]

    hyp.selectAppend 'path.hyperbola'
      .datum poly
      .attr 'd', (v)->lineGenerator(v)+"Z"
      .attr 'fill', "url(##{mid})"
      .attr 'stroke', 'transparent'
      .attr 'opacity', sfn(angularError)

    #if nominal
      #hyp.selectAppend 'line.nominal'
        #.attrs x1: -largeNumber, x2: largeNumber
        #.attr 'stroke', '#000000'

  dfunc.setupGradient = (el)->
    defs = el.append 'defs'
    defs.call gradientHelper

  dfunc.width = (o)->
    return width unless o?
    width = o
    return dfunc

  dfunc.nominal = (o)->
    return nominal unless o?
    nominal = o
    return dfunc

  return dfunc

digitizedLine = (viewpoint, lineGenerator)->
  axes=M.eye(3)
  f = (d)->
    ### Create a line from input points ###
    ### Put in axis-aligned coordinates ###
    q = Q.fromAxisAngle [0,0,1], viewpoint
    R = M.transpose matrix(axes)
    alignedWithGroup = dot(d.centered, R)
    offs = dot(d.offset,R)
    v = alignedWithGroup.toArray()
      .map (row)-> M.add(row,offs)
    a = dot(v, q)
    ### Map down to two dimensions (the x-z plane of the viewing geometry) ###
    data = dot(a, T).toArray()

    d3.select(@).attr 'd', lineGenerator(data)

  f.axes = (o)->
    return axes unless o?
    axes = o
    return f

  return f

apparentDip = (viewpoint, xScale,yScale)->
  axes = M.eye(3)
  {ratioX,ratioY,screenRatio, lineGenerator} = getRatios(xScale, yScale)

  #if not axes?
  f = (d)->

    #d3.select @
      #.attr 'd',lineGenerator(lineData)
      #.attr 'transform', "translate(#{xScale(offs[0])},#{yScale(offs[2])})rotate(#{v})"

    planeAxes = d.axes
    if d.group?
      planeAxes = d.group.axes
    ### Create a line from input points ###
    ### Put in axis-aligned coordinates ###
    q = Q.fromAxisAngle [0,0,1], viewpoint
    R = M.transpose matrix(axes)

    A = planeAxes
    # Find fit normal in new coordinates
    normal = dot(A[2],R,q)
    # Get transform that puts normal in xz plane
    n = normal.toArray()
    n[1] = Math.abs(n[1])
    n1 = [n[0],0,n[2]]
    n1 = n1.map (d)->d/M.norm(n1)
    console.log n,n1
    qR = Q.fromBetweenVectors(n,n1)

    # Without adding this other quaternion, it is the same as just showing
    # digitized lines
    qA = q.mul qR

    v = dot(d.centered, R)
    a = dot(v, qA)
    ### Map down to two dimensions (the x-z plane of the viewing geometry) ###
    data = dot(a, T).toArray()


    # Get offset of angles
    offs = dot(d.offset,R,q,T).toArray()

    d3.select(@)
      .attr 'd', lineGenerator(data)
      .attr 'transform', "translate(#{xScale(offs[0])},#{yScale(offs[1])})"


  f.axes = (o)->
    return axes unless o?
    axes = o
    return f

  return f

class PlaneData
  constructor: (data, mean=null)->
    {axes, hyperbolic_axes, extracted, color} = data
    @mean = mean or data.mean
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
    if not @mean?
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

