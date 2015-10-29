d3 = require 'd3'
Stereonet = require './stereonet.coffee'

el = d3.select '.stereonet'

d = el.attr 'data-curves'
data = JSON.parse d
el.attr 'data-curves', ''

console.log data
stereonet = new Stereonet el

addItem = (d, opts)->
  for level in [1,2]
    opts.level = level
    stereonet.addGirdle d[level],opts
  stereonet.addPath d.nominal, opts

if data.components.length > 0
  for i in data.components
    addItem i, class: 'component'

console.log data.main
addItem data.main, class: 'main'

stereonet.draw()
