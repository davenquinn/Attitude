
d =
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

attrs = (sel, obj)->
  for k,v of obj
    sel.attr k,v

export default (stereonet)->
  labelDistance = 4
  ->
    da = stereonet.overlay()
    g = da.append 'g'
      .attr 'class', 'horizontal'

    g.append 'path'
      .datum d

    sz = stereonet.size()
    margin = stereonet.margin()
    l = g.append 'g'
      .attr 'class', 'labels'
      .attr 'transform', "translate(#{margin} #{sz/2})"

    obj = l.append 'text'
      .text 'E'
    
    attrs(obj, {
        class: 'axis-label'
        transform: "translate(#{sz-2*margin} 0)"
        'text-anchor': 'start'
        dx: labelDistance
    })

    obj = l.append 'text'
      .text 'W'
    
    attrs obj, {
        class: 'axis-label'
        'text-anchor': 'end'
        dx: -labelDistance
    }

    # Vertical labels (may split out later)
    v = da.append 'g'
      .attr 'class', 'vertical'
      .attr 'transform', "translate(#{sz/2} #{margin})"

    v.append 'line'
      .attr 'y2', labelDistance

    v.append 'line'
      .attr 'transform', "translate(0 #{sz-2*margin})"
      .attr 'y2', -labelDistance

    obj = v.append 'text'
      .text 'Vertical'
    
    attrs obj, {
        class: 'axis-label'
        'alignment-baseline': 'baseline'
        'text-anchor': 'middle'
        dy: -labelDistance-4
    }
