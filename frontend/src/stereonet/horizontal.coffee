
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
      .attrs
        class: 'labels'
        transform: "translate(#{margin} #{sz/2})"

    l.append 'text'
      .text 'E'
      .attrs
        class: 'axis-label'
        transform: "translate(#{sz-2*margin} 0)"
        'text-anchor': 'start'
        dx: labelDistance
    l.append 'text'
      .text 'W'
      .attrs
        class: 'axis-label'
        'text-anchor': 'end'
        dx: -labelDistance

    # Vertical labels (may split out later)
    v = da.append 'g'
      .attrs
        class: 'vertical'
        transform: "translate(#{sz/2} #{margin})"

    v.append 'line'
      .attrs
        y2: labelDistance

    v.append 'line'
      .attrs
        transform: "translate(0 #{sz-2*margin})"
        y2: -labelDistance

    v.append 'text'
      .text 'Vertical'
      .attrs
        class: 'axis-label'
        'alignment-baseline': 'baseline'
        'text-anchor': 'middle'
        dy: -labelDistance-4
