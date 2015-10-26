d3 = require 'd3'
Stereonet = require './stereonet.coffee'

el = d3.select '.stereonet'

d = el.attr 'data-curves'
data = JSON.parse d
el.attr 'data-curves', ''

console.log data
stereonet = new Stereonet el

if data.components.length > 0
  for i in data.components
    stereonet.addData i

stereonet.addData data.main
stereonet.draw()
