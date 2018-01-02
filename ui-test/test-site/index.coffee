readTextFile = (file, callback) ->
  rawFile = new XMLHttpRequest
  rawFile.overrideMimeType 'application/json'
  rawFile.open 'GET', file, true
  rawFile.onreadystatechange = ->
    if (rawFile.readyState == 4 and rawFile.status == 200)
      callback rawFile.responseText
  rawFile.send null

readTextFile '/data.json', (text) ->
  data = JSON.parse(text)

  d3.select(".attitude-area")
    .datum data
    .call attitudeUI.createUI
