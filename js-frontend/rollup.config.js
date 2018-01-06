import babel from 'rollup-plugin-babel'
import coffee2 from 'rollup-plugin-coffee2'
import stylus from 'rollup-plugin-stylus'
import commonJS from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve';

let plugins = [
  coffee2({version: 2}),
  stylus({output: 'lib/styles.css', sourceMap: false}),
  nodeResolve({browser:true,main:true}),
  commonJS({
    extensions: [ '.js', '.coffee' ],
    include: 'node_modules/**'
  })
];

export default {
  input: "src/index.coffee",
  external: ["d3","mathjs"],
  output: {
    file: "lib/attitude.js",
    globals: {
      "d3": "d3",
      "mathjs": "math"
    },
    format: "umd",
    name: "attitude",
    extend: true
  },
  plugins: plugins
}
