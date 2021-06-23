import {Stereonet, opacityByCertainty, globalLabels,chroma} from "attitude/src"
import {hyperbolicErrors, apparentDip, digitizedLine, PlaneData, fixAngle} from "attitude/src"
import style from './ui-styles.styl'
import '@blueprintjs/core/lib/css/blueprint.css'
import {InteractiveStereonetComponent} from './components/stereonet'
import {SideViewComponent} from './components/side-view'
import {DataPanelComponent} from './components/data-panel'
import {SelectionListComponent} from './components/list'
import h from 'react-hyperscript'
import React from 'react'
import ReactDOM from 'react-dom'
import * as d3 from 'd3'
import 'd3-jetpack'
import { FocusStyleManager, Tab, Tabs } from "@blueprintjs/core"

FocusStyleManager.onlyShowFocusOnTabs()

class AttitudeUI extends React.Component
  @defaultProps: {
    width: 760
    attitudes: []
    stereonetPrecision: 0.1
    allowGroupSelection: true
  }
  constructor: (props)->
    super props
    @state = {
      showGroups: true
      azimuth: 0
      hovered: null
      zoomedToSelection: false
      selection: []
    }
  findAttitudes: (list)->
    {attitudes} = @props
    out = []
    for o in list
      out.push attitudes.find (d)->o == d.uid
    return out

  render: ->
    {attitudes, stereonetPrecision, width} = @props
    {azimuth, hovered, selection, showGroups, zoomedToSelection} = @state
    data = attitudes
    onHover = @onHover
    updateSelection = @updateSelection

    selectionList = h SelectionListComponent, {
      attitudes, selection,
      showGroups,
      zoomedToSelection,
      zoomToSelection: =>
        @setState {zoomedToSelection: not @state.zoomedToSelection}
      onToggleShowGroups: =>
        @setState {showGroups: not @state.showGroups}
      onHover,
      onClearSelection: (d)=>@setState selection: []
      hovered, onClick: (d)=>
        @updateSelection([d])
    }

    dataPanel = h DataPanelComponent, {attitude: hovered}


    h 'div.attitude-area', {style: {width}}, [
      h 'div.row', [
        h InteractiveStereonetComponent, {
          data: @getData()
          onRotate: @onStereonetRotate
          onHover
          updateSelection
          precision: stereonetPrecision
          hovered
        }
        h Tabs, {className: 'data-panel'}, [
          h Tab, {id: 'measurement-data', title: 'Info', panel: dataPanel}
          h Tab, {id: 'selection-list', title: 'List', panel: selectionList}
          h Tabs.Expander
        ]
      ]
      #h SideViewComponent, {data, azimuth, hovered,
      #                      onHover, updateSelection}
    ]

  getData: =>
    {attitudes} = @props
    {zoomedToSelection, selection} = @state
    return attitudes unless zoomedToSelection
    return selection

  onStereonetRotate: (pos)=>
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
    for id in ids
      continue if id.members? and not @props.allowGroupSelection
      ix = collectedIDs.indexOf(id)
      if ix == -1
        collectedIDs.push(id)
      else
        collectedIDs.splice ix,1
    @setState selection: collectedIDs

createUI = (node,data) ->
  el = h AttitudeUI, {attitudes: data}
  ReactDOM.render(el, node)

# global.attitudeUI = createUI
# global.d3 = d3

export {createUI, AttitudeUI, InteractiveStereonetComponent as Stereonet}
