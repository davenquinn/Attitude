import coffee2 from 'rollup-plugin-coffee2'
import stylus from 'rollup-plugin-stylus'
import commonJS from 'rollup-plugin-commonjs'
import {dependencies} from './package.json'
import nodeResolve from 'rollup-plugin-node-resolve';

let plugins = [
  coffee2({version: 2}),
  stylus({output: 'lib/styles.css', sourceMap: false}),
  nodeResolve({jsnext:true,main:true}),
  commonJS({
    extensions: [ '.js', '.coffee' ],
    include: 'node_modules/**'
  })
];

export default {
  input: "src/index.coffee",
  external: Object.keys(dependencies),
  output: {
    file: "lib/attitude.node.js",
    format: "cjs",
    name: "attitude",
    extend: true
  },
  plugins: plugins
}
