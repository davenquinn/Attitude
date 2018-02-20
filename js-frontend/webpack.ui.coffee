path = require 'path'
BrowserSyncPlugin = require 'browser-sync-webpack-plugin'
UglifyJS = require 'uglifyjs-webpack-plugin'
{IgnorePlugin} = require 'webpack'
webRoot = path.resolve './ui-test/test-site'

browserSync = new BrowserSyncPlugin {
  port: 3000
  host: 'localhost'
  server: {
    baseDir: [ webRoot ]
    routes: {
      '/lib': 'lib'
    }
  }
}

shouldMinify = true

plugins = [browserSync]

if shouldMinify
  plugins.push new UglifyJS()

babelLoader = {
  loader: 'babel-loader'
  options: {
    presets: ['env','react']
    sourceMap: false
  }
}

exclude = /node_modules/

coffeeLoader = {
  loader: 'coffee-loader'
  options: {sourceMap: true}
}

cssLoader = {
  loader: 'css-loader',
  options: {minimize: shouldMinify}
}

module.exports = {
  module:
    rules: [
      {test: /\.coffee$/, use: [babelLoader, coffeeLoader], exclude}
      {test: /\.(js|jsx)$/, use: [babelLoader], exclude}
      {test: /\.styl$/, use: ["style-loader", cssLoader, "stylus-loader"]}
      {test: /\.css$/, use: ["style-loader", cssLoader]}
    ]
  resolve:
    extensions: [".coffee", ".js"]
  entry: "./ui-src/index.coffee"
  output:
    path: path.resolve("./lib")
    publicPath: "/lib"
    filename: "attitude-ui.js"
  plugins
}

