cloneOptions = (obj, newProps)->
  a = {}
  for k of obj
    a[k] = newProps[k] or obj[k]
  return a

export {cloneOptions}
