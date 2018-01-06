import coffee2 from 'rollup-plugin-coffee2'
import stylus from 'rollup-plugin-stylus'
import commonJS from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve';

let plugins = [
  coffee2({version: 2}),
  stylus({output: 'lib/ui-styles.css', sourceMap: false}),
  nodeResolve({browser:true,main:true}),
  commonJS({
    extensions: [ '.js', '.coffee', '.styl'],
    include: 'node_modules/**'
  })
];

export default {
  input: "ui-src/index.coffee",
  external: ['d3','d3-selection-multi','d3-jetpack'],
  output: {
    file: "lib/attitude-ui.js",
    format: "iife",
    globals: {
      "d3": "d3",
      "mathjs": "math"
    },
    name: "attitudeUI",
    extend: true
  },
  plugins: plugins
}

