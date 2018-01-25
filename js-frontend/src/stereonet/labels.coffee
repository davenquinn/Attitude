###
Stereonet labeling:
Based heavily on http://bl.ocks.org/dwtkns/4686432

TODO: integrate text halos
http://bl.ocks.org/nitaku/aff4f425e7959290a1f7
###
import {geoPath, geoDistance} from 'd3'

labels = [
  {name: 'N', c: [180,0]}
  {name: 'E', c: [90,0]}
  {name: 'S', c: [0,0]}
  {name: 'W', c: [-90,0]}
  {name: 'Up', c: [0,90]}
  {name: 'Down', c: [0,-90]}
]

__horizontalLine =
  type: 'Feature'
  geometry:
    type: 'LineString'
    coordinates: [
      [180,0]
      [-90,0]
      [0,0]
      [90,0]
      [180,0]
    ]

horizontalLine = (stereonet)->
  stereonet
    .overlay()
    .append 'g'
    .attr("class","horizontal")
    .append 'path'
    .datum __horizontalLine
  stereonet.refresh()

globalLabels = ->
  for l in labels
    l.type = 'Feature'
    l.geometry = {type: 'Point', coordinates: l.c}

  (stereonet)->
    sz = stereonet.size()
    proj = stereonet.projection()
    svg = stereonet.overlay()

    path = geoPath()
      .projection(proj)
      .pointRadius(1)

    updateLabels = ->
      console.log "Updating labels"
      proj = @projection()
      centerPos = proj.invert([sz/2,sz/2])
      width = stereonet.size()

      svg.selectAll(".label")
        .attr 'alignment-baseline', 'middle'
        .style 'text-shadow',"
            -2px -2px white,
            -2px 2px white,
            2px 2px white,
            2px -2px white,
            -2px 0 white,
            0 2px white,
            2px 0 white,
            0 -2px white"
        .attr "text-anchor", (d)->
          x = proj(d.geometry.coordinates)[0]
          if x < width/2-20
            return 'end'
          if x < width/2+20
            return 'middle'
          return 'start'
        .attr "transform", (d)->
          [x,y] = proj(d.geometry.coordinates)
          offset = if x < width/2 then -5 else 5
          offsetY = 0
          if y < width/2-20
            offsetY = -5
          if y > width/2+20
            offsetY = 5
          return "translate(#{x+offset},#{y-2+offsetY})"
        .style "display", (d)->
          dist = geoDistance(centerPos,d.geometry.coordinates)
          if (d.name == 'Up' or d.name == 'Down')
            return 'none' if dist < Math.PI/4
          return if dist > Math.PI/2+0.01 then 'none' else 'inline'

    stereonet.call horizontalLine

    svg.append("g")
      .attr("class", "points")
      .selectAll("path")
      .data(labels)
      .enter()
      .append("path")
      .attr("class", "point")

    svg.append("g")
      .attr("class","labels")
      .selectAll("text")
      .data(labels)
      .enter()
      .append("text")
      .attr("class","label")
      .text (d)-> d.name

    updateLabels.apply stereonet

    stereonet.on 'rotate', updateLabels

export {globalLabels}
