import babel from 'rollup-plugin-babel'
import coffee2 from 'rollup-plugin-coffee2'
import stylus from 'rollup-plugin-stylus'
import commonJS from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve';

let plugins = [
  coffee2({version: 2}),
  stylus({output: 'lib/styles.css'}),
  nodeResolve({jsnext:true,main:true}),
  commonJS({
    extensions: [ '.js', '.coffee' ],
    include: 'node_modules/**'
  })
];

export default {
  entry: "src/index.coffee",
  dest: "lib/attitude.js",
  extend: true,
  format: "cjs",
  moduleName: "attitude",
  plugins: plugins
}
