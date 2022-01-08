const path = require('path');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const UglifyJS = require('uglifyjs-webpack-plugin');
const {IgnorePlugin} = require('webpack');
const webRoot = path.resolve('./graphical-tests');

const browserSync = new BrowserSyncPlugin({
  port: 3000,
  host: 'localhost',
  server: {
    baseDir: [ webRoot ],
    routes: {
      '/lib': 'lib'
    }
  }
});

const shouldMinify = true;

const plugins = [browserSync];

if (shouldMinify) {
  plugins.push(new UglifyJS());
}

const babelLoader = {
  loader: 'babel-loader',
  options: {
    presets: ['env','react'],
    sourceMap: false
  }
};

const exclude = /node_modules/;

const coffeeLoader = {
  loader: 'coffee-loader',
  options: {sourceMap: true}
};

const cssLoader = {
  loader: 'css-loader',
  options: {minimize: shouldMinify}
};

module.exports = {
  module: {
    rules: [
      {test: /\.coffee$/, use: [babelLoader, coffeeLoader], exclude},
      {test: /\.(js|jsx)$/, use: [babelLoader], exclude},
      {test: /\.styl$/, use: ["style-loader", cssLoader, "stylus-loader"]},
      {test: /\.css$/, use: ["style-loader", cssLoader]}
    ]
  },
  resolve: {
    extensions: [".coffee", ".js"]
  },
  entry: "./ui-src/index.coffee",
  output: {
    path: path.resolve("./lib"),
    publicPath: "/lib",
    filename: "attitude-ui.js"
  },
  plugins
};

