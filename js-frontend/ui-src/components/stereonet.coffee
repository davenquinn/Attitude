import React from 'react'
import ReactDOM from 'react-dom'
import h from 'react-hyperscript'
import * as d3 from 'd3'
import {Stereonet, opacityByCertainty, globalLabels,chroma} from "../../src"

class StereonetComponent extends React.Component
  @defaultProps: {
    onRotate: ->
  }
  constructor: (props)->
    super props
  componentDidMount: ->
    {data} = @props
    @stereonet = Stereonet()
      .size(400)
      .margin(25)

    node = ReactDOM.findDOMNode(@)
    svg = d3.select(node)
      .call(@stereonet)

    c = (d) ->
      d.color

    @stereonet.planes(data)
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

    @stereonet.call globalLabels()
    @stereonet.draw()

    {onRotate} = @props
    @stereonet.on 'rotate.cb', ->
      onRotate @centerPosition()

  render: ->
    h 'svg.stereonet'

export {StereonetComponent}
