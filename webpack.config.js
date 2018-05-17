const path = require('path');

module.exports = {
  entry: ['babel-polyfill', './src/index.ts'],
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'index.js',
    library: 'dr'
  },
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader'
      }
    ],
  },
  resolve: {
    extensions: ['.js', '.json', '.ts']
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'public')
  }
};
