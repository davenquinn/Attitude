readTextFile = (file, callback) ->
  rawFile = new XMLHttpRequest
  rawFile.overrideMimeType 'application/json'
  rawFile.open 'GET', file, true
  rawFile.onreadystatechange = ->
    if (rawFile.readyState == 4 and rawFile.status == 200)
      callback rawFile.responseText
  rawFile.send null

{Stereonet, opacityByCertainty, globalLabels,chroma} = window.attitude

copyIDToClipboard = (d)->
  console.log d.uid

console.log 'stuff'
readTextFile '/data.json', (text) ->
  data = JSON.parse(text)
  console.log data

  ###
  Stereonet
  ###
  stereonet = Stereonet()
    .size(400)
    .margin(25)

  svg = d3.select('#stereonet')
    .attr('class', 'stereonet')
    .call(stereonet)

  c = (d) ->
    d.color

  dataA = data

  stereonet.planes(dataA)
    .each(opacityByCertainty(c, 'path.error'))
    .classed 'in-group', (d)->d.member_of?
    .classed 'is-group', (d)->d.members?
    .each (d) ->
      if d.max_angular_error > 45
        d3.select @
          .select 'path.error'
          .remove()

      d3.select @
        .select('path.nominal')
        .attr 'stroke', d.color

  stereonet.call globalLabels()
  stereonet.draw()

  darkenColor = (c)->
    chroma(c).darken(2).css()

  fmt = d3.format '.0f'

  updateSelected = (d)->
    planeContainer
      .selectAll 'path.trace'
      .attr 'stroke', (v)->
        c = darkenColor(v.color)
        if not d?
          return c
        if v.data.uid == d.uid
          c = v.color
        return c

    dA = d3.select "div#data div.plane-desc"

    stereonet.dataArea()
      .select 'g.hovered'
      .remove()

    if not d?
      dA.style 'display','none'
      return

    stereonet.planes([d], selector: 'g.hovered')
      .each (d) ->
        s = d3.select @
        s.select 'path.error'
          .attrs
            fill: d.color
            'fill-opacity': 0.5

        s.select('path.nominal')
          .attr 'stroke', d.color

    dA.style 'display','block'

    dA.select "span.id"
      .text d.uid

    updateValue = (id,num)->
      dA.select "span.#{id}"
        .text fmt(num)

    updateValue('strike',d.strike)
    updateValue('dip',d.dip)
    updateValue('min',d.min_angular_error)
    updateValue('max',d.max_angular_error)

  svg
    .selectAll 'g.planes g.plane path.error'
    .on 'mouseenter', (d)->
      d = d3.select(@parentElement).datum()
      updateSelected d
    .on 'click', (d)->
      d = d3.select(@parentElement).datum()
      collectID d.data.uid

  d3.select(".attitude-area").on 'mouseleave', ->updateSelected()

  ###
  Horizontal
  ###

  M = math
  {hyperbolicErrors, apparentDip, digitizedLine, PlaneData, fixAngle} = attitude

  for f in dataA
    f.is_group = f.members?

  singlePlanes = dataA
    .filter (d)->not d.is_group
    .map (d)->new PlaneData d

  totalLength = 0
  accum = [0,0,0]
  weights = singlePlanes.map (plane)->
    d = plane.data
    if not d.centered_array?
      return [0,0,0]
    len = d.centered_array.length
    totalLength += len
    return d.center.map (a)->a*len

  overallCenter = [0..2].map (i)->
    d3.sum weights, (d)->d[i]/totalLength

  for p in singlePlanes
    p.offset = M.subtract(p.mean, overallCenter)
    p.in_group = false
    if p.data.member_of?
      group = dataA.find (d)->d.uid == p.data.member_of
      p.group = new PlaneData group, p.mean
      p.group.offset = p.offset
      p.in_group = true

  margin = 30
  marginLeft = 50
  marginRight = 100
  sz = {width: 800, height: 300}
  innerSize =
    width: sz.width-marginLeft-marginRight
    height: sz.height-2*margin

  svg = d3.select 'svg#horizontal'
    .at sz
    .append 'g'
    .at transform: "translate(#{marginLeft},#{margin})"

  x = d3.scaleLinear()
    .range [0,innerSize.width]
    .domain [-1000,1000]

  y = d3.scaleLinear()
    .range [innerSize.height,0]
    .domain [-600,600]

  dataArea = svg.append 'g.data'

  ### Setup data ###

  errorContainer = dataArea.append 'g.errors'
  errorContainerGrouped = dataArea.append 'g.errors-grouped'
  planeContainer = dataArea.append 'g.planes'

  setScale = (scale, mPerPx)->
    r = scale.range()
    w = r[1]-r[0]
    mWidth = Math.abs(w*mPerPx)
    scale.domain [-mWidth/2,mWidth/2]

  setScale(x, 0.8)
  setScale(y, 0.8)

  lineGenerator = d3.line()
    .x (d)->x(d[0])
    .y (d)->y(d[1])

  updatePlanes = (angle)->

    v_ = M.eye(3).toArray()
    hyp = hyperbolicErrors(angle, v_, x,y)
      .width(150)
      .nominal(false)

    if not d3.select('#gradient').node()
      errorContainer.call hyp.setupGradient

    # Individual data
    ## We have some problems showing large error angles
    sel = errorContainer
      .selectAll 'g.error-hyperbola'
      .data singlePlanes

    esel = sel.enter()
      .append 'g.error-hyperbola'
      .classed 'in-group', (d)->d.group?

    esel.merge(sel)
        .each hyp
        .sort (a,b)->a.__z-b.__z

    # Grouped data
    gp = singlePlanes.filter (d)->d.group?
            .map (d)->d.group

    sel = errorContainerGrouped
      .selectAll 'g.error-hyperbola'
      .data gp
    esel = sel.enter()
      .append 'g.error-hyperbola'
    esel.merge(sel)
        .each hyp
        .sort (a,b)->a.__z-b.__z

    dataWithTraces = singlePlanes.filter (d)->d.centered?
    se = planeContainer
      .selectAll 'path.trace'
      .data dataWithTraces

    ese = se.enter()
      .append 'path.trace'
      .attr 'stroke', (d)->darkenColor(d.color)
      .on 'mouseover', (d)->
        updateSelected(d.data)
      .on 'click', (d)->
        collectID d.data.uid

    df = digitizedLine(angle, lineGenerator)
    ese.merge(se).each df

    az = fmt(fixAngle(angle+Math.PI/2)*180/Math.PI)
    azLabel.text "Distance along #{az}º"

  stereonet.on 'rotate.cb', ->
    [lon,lat] = @centerPosition()
    az = lon
    az *= -Math.PI/180
    updatePlanes(az)

  ### Setup axes ###
  axes = svg.append 'g.axes'

  yA = d3.scaleLinear()
    .domain y.domain().map (d)->d+overallCenter[2]
    .range y.range()

  yAx = d3.axisLeft yA
    .tickFormat fmt
    .tickSizeOuter 0

  axes.append 'g.y.axis'
    .call yAx
    .append 'text.axis-label'
    .text 'Elevation (m)'
    .attr 'transform', "translate(-40,#{innerSize.height/2}) rotate(-90)"
    .style 'text-anchor','middle'

  __domain = x.domain()
  __dw = (__domain[1]-__domain[0])

  xA = d3.scaleLinear()
    .domain [0,__dw]
    .range x.range()

  xAx = d3.axisBottom xA
    .tickFormat fmt
    .tickSizeOuter 0

  _x = axes.append 'g.x.axis'
    .translate [0,innerSize.height]
    .call xAx

  azLabel = _x.append 'text.axis-label'
    .attr 'transform', "translate(#{innerSize.width/2},20)"
    .style 'text-anchor','middle'

  ### Update data after setup ###
  updatePlanes(0)


  ### Collected ids ###
  collectedIDs = []
  collectID = (id)->
    console.log id
    ix = collectedIDs.indexOf(id)
    console.log ix
    if ix == -1
      collectedIDs.push(id)
    else
      collectedIDs.splice ix,1
    cid = collectedIDs.map (v)-> "\"#{v}\""
    console.log cid.join(',')
    d3.select '.collected-ids'
      .text "[#{cid.join(',')}]"
