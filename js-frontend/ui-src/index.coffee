import {Stereonet, opacityByCertainty, globalLabels,chroma} from "../src"
import {hyperbolicErrors, apparentDip, digitizedLine, PlaneData, fixAngle} from "../src"
import style from './ui-styles.styl'
import {StereonetComponent} from './components/stereonet'
import {SideViewComponent} from './components/side-view'
import {DataPanelComponent} from './components/data-panel'
import h from 'react-hyperscript'
import ReactDOM from 'react-dom'
import React from 'react'
import { Hotkey, Hotkeys, HotkeysTarget } from "@blueprintjs/core"

class SelectionListComponent extends React.Component
  render: ->
    if @props.selection.length == 0
      return h 'div', "Selected measurements will
                       be listed here for copying
                       into code"
    cid = @props.selection.map (v)-> "\"#{v.uid}\""
    h 'div.collected-ids', {}, "[#{cid.join(',')}]"

class AttitudeUI extends React.Component
  @defaultProps: {width: 800, attitudes: []}
  constructor: (props)->
    super props
    @state = {
      azimuth: 0
      hovered: null
      selection: []
    }
  render: ->
    {attitudes} = @props
    {azimuth, hovered, selection} = @state
    data = attitudes
    onHover = @onHover
    updateSelection = @updateSelection

    h 'div.attitude-area', [
      h 'div.row', [
        h StereonetComponent, {
          data,
          onRotate: @onStereonetRotate
          onHover
          updateSelection
          hovered
        }
        h DataPanelComponent, {attitude: hovered, selection}
      ]
      h SideViewComponent, {data, azimuth, hovered,
                            onHover, updateSelection}
      h SelectionListComponent, {selection}
    ]

  onStereonetRotate: (pos)=>
    console.log pos
    [lon,lat] = pos
    azimuth = -Math.PI/180*lon
    @setState {azimuth}

  onHover: (hovered=null)=>
    @setState {hovered}

  componentDidMount: ->
    d3.select ReactDOM.findDOMNode(@)
      .on 'mouseleave', => @onHover()

  updateSelection: (id)->
    collectedIDs = @state.selection
    ix = collectedIDs.indexOf(id)
    console.log ix
    if ix == -1
      collectedIDs.push(id)
    else
      collectedIDs.splice ix,1
    @setState selection: collectedIDs

  renderHotkeys: ->
    h Hotkeys, [
      h Hotkey, {
          group: "Selection"
          combo: "s"
          label: "Add a measurement to the selection"
          onKeyDown: =>
            {hovered} = @state
            return unless hovered?
            @updateSelection hovered
      }
      h Hotkey, {
          group: "Selection"
          combo: "backspace"
          label: "Clear selection"
          onKeyDown: =>
            @setState {selection: []}
      }
    ]

HotkeysTarget AttitudeUI

createUI = (__base) ->
  data = __base.datum()
  el = h AttitudeUI, {attitudes: data}
  ReactDOM.render(el, __base.node())

export {createUI}
