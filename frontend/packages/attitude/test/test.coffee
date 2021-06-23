{assert} = require 'chai'
Promise = require 'bluebird'
d3 = require 'd3'
{exec} = require 'child_process'
runCommand = Promise.promisify exec
M = require 'mathjs'

randomPCA = ->
  cmd = "python #{__dirname}/test-runner.py random_pca"
  stdout = await runCommand cmd
  return JSON.parse stdout

describe 'math module', ->
  it 'should be importable', ->
    {math} = require '..'
    assert math?

  describe '`Attitude` python module', ->
    it 'should be importable', ->
      [stdout, stderr] = await runCommand 'python -c "import attitude"'
      assert not stderr?

    d = null
    it 'random PCA should produce a 3x3 array', ->
      d = await randomPCA()
      sz = M.size(d)
      assert sz[0] == 3 and sz[1] == 3

    it 'should deconvolve axes', ->
      {math, functions} = require '..'

      axs = math.deconvolveAxes d
      e = math.combinedErrors.apply null, axs
      polygon = functions.errorSurface e
      line = functions.nominalPlane e
      points = line.geometry.coordinates.map (d)->
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: d
          }
        }

      pt = points[0]
      v = d3.geoContains(polygon, pt)
      assert v, "point is in polygon"

