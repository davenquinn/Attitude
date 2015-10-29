d3 = require 'd3'
Stereonet = require './stereonet.coffee'

el = d3.select '.stereonet'

d = el.attr 'data-curves'
data = JSON.parse d
el.attr 'data-curves', ''

console.log data
stereonet = new Stereonet el

if data.components.length > 0
  opts = {class: 'component', level: 1}
  for i in data.components
    stereonet.addGirdle i[1],opts
    stereonet.addPath i.nominal, opts

opts =
  class: 'main'
  level: 1

stereonet.addGirdle data.main[1], opts
stereonet.addPath data.main.nominal, opts

stereonet.draw()
