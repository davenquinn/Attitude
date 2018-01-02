import coffee2 from 'rollup-plugin-coffee2'
import stylus from 'rollup-plugin-stylus'
import commonJS from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve';

let plugins = [
  coffee2({version: 2}),
  stylus({output: 'lib/ui-styles.css'}),
  nodeResolve({browser:true,main:true}),
  commonJS({
    extensions: [ '.js', '.coffee', '.styl'],
    include: 'node_modules/**'
  })
];

export default {
  entry: "ui-src/index.coffee",
  dest: "lib/attitude-ui.js",
  extend: true,
  external: ['d3','d3-selection-multi','d3-jetpack'],
  globals: {
    "d3": "d3",
    "mathjs": "math"
  },
  format: "iife",
  moduleName: "attitudeUI",
  plugins: plugins
}

