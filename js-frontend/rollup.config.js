import babel from 'rollup-plugin-babel'
import coffee2 from 'rollup-plugin-coffee2'

let plugins = [
  coffee2({version: 2})
]

export default {
  entry: "src/index.coffee",
  dest: "lib/attitude.js",
  extend: true,
  format: "cjs",
  moduleName: "attitude",
  plugins: plugins
}
