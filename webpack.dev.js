const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const { NamedModulesPlugin, HotModuleReplacementPlugin } = require('webpack');

module.exports = merge(common, {
  devtool: 'inline-source-map',
  mode: 'development',
  devServer: {
    contentBase: './dist',
    hot: true,
  },
  plugins: [new NamedModulesPlugin(), new HotModuleReplacementPlugin()],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        sideEffects: true,
      },
    ],
  },
});
