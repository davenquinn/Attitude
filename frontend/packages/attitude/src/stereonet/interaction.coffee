import * as d3 from 'd3'
import {select, event} from '../selection'

## Stereonet Dragging
export default (stereonet)->
  # modified from http://bl.ocks.org/1392560
  m0 = undefined
  o0 = undefined
  proj = stereonet.projection()
  el = stereonet.node()

  mousedown = ->
    m0 = [
      event.pageX
      event.pageY
    ]
    o0 = stereonet.rotate()
    event.preventDefault()

  mousemove = ->
    if m0
      m1 = [
        event.pageX
        event.pageY
      ]
      o1 = [
        o0[0] + (m1[0] - (m0[0])) / 3
        o0[1] + (m0[1] - (m1[1])) / 3
      ]
      limit = 90
      o1[1] = if o1[1] > limit then limit else if o1[1] < -limit then -limit else o1[1]
      stereonet.rotate o1

  mouseup = ->
    if m0
      mousemove()
      m0 = null

  el.on('mousedown', mousedown)
  select(window)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup)
