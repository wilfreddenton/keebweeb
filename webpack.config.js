const path = require('path')
const EsLintPlugin = require('eslint-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [{
      test: /\.s[ac]ss$/i,
      use: ["style-loader", "css-loader", "sass-loader"]
    }, {
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    }]
  },
  devtool: 'inline-source-map',
  // https://stackoverflow.com/a/63781351/1229165
  devServer: {
    host: '0.0.0.0',
    disableHostCheck: true,
    contentBase: './dist'
  },
  plugins: [
    new EsLintPlugin(),
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ]
}
