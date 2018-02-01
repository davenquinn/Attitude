import {Stereonet, opacityByCertainty, globalLabels,chroma} from "../src"
import {hyperbolicErrors, apparentDip, digitizedLine, PlaneData, fixAngle} from "../src"
import style from './ui-styles.styl'
import {InteractiveStereonetComponent} from './components/stereonet'
import {SideViewComponent} from './components/side-view'
import {DataPanelComponent} from './components/data-panel'
import h from 'react-hyperscript'
import React from 'react'
import ReactDOM from 'react-dom'
import * as d3 from 'd3'
import 'd3-jetpack'
import { FocusStyleManager, Hotkey, Hotkeys, HotkeysTarget } from "@blueprintjs/core"

FocusStyleManager.onlyShowFocusOnTabs()

class SelectionListComponent extends React.Component
  render: ->
    if @props.selection.length == 0
      return h 'div', "Selected measurements will
                       be listed here for copying
                       into code"
    cid = @props.selection.map (v)-> "\"#{v.uid}\""
    h 'div.collected-ids', {}, "[#{cid.join(',')}]"

class AttitudeUI extends React.Component
  @defaultProps: {
    width: 800
    attitudes: []
    stereonetPrecision: 0.1
  }
  constructor: (props)->
    super props
    @state = {
      azimuth: 0
      hovered: null
      selection: []
    }
  findAttitudes: (list)->
    {attitudes} = @props
    out = []
    for o in list
      out.push attitudes.find (d)->o == d.uid
    return out

  render: ->
    {attitudes, stereonetPrecision} = @props
    {azimuth, hovered, selection} = @state
    data = attitudes
    onHover = @onHover
    updateSelection = @updateSelection
    h 'div.attitude-area', [
      h 'div.row', [
        h InteractiveStereonetComponent, {
          data,
          onRotate: @onStereonetRotate
          onHover
          updateSelection
          precision: stereonetPrecision
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

  onHover: (d)=>
    if not d?
      @setState {hovered: null}
      return
    # Transfer selection to group
    if d.member_of?
      newSel = @findAttitudes([d.member_of])[0]
      d = newSel if newSel?
    if d.members?
      hovered = [d, @findAttitudes(d.members)...]
    else
      hovered = [d]
    console.log hovered
    @setState {hovered}

  componentDidMount: ->


    d3.select ReactDOM.findDOMNode(@)
      .on 'mouseenter', ->
        console.log "Focusing on", @
        @focus()
      .on 'mouseleave', => @onHover()

  updateSelection: (ids)->
    collectedIDs = @state.selection
    console.log @state.selection
    for id in ids
      continue if id.members?
      ix = collectedIDs.indexOf(id)
      if ix == -1
        collectedIDs.push(id)
      else
        collectedIDs.splice ix,1
    @setState selection: collectedIDs

  renderHotkeys: =>
    h Hotkeys, [
      h Hotkey, {
          group: "Selection"
          combo: "s"
          label: "Add a measurement to the selection"
          onKeyDown: =>
            {hovered} = @state
            return unless hovered?
            console.log "Updating selection"
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

createUI = (node,data) ->
  el = h AttitudeUI, {attitudes: data}
  ReactDOM.render(el, node)

global.attitudeUI = createUI
global.d3 = d3

export {createUI}
