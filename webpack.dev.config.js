const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/index.ts",
  devtool: "inline-source-map",
  experiments: {
    outputModule: true,
  },
  devServer: {
    static: [
      {
        directory: path.join(__dirname, "example"),
        publicPath: "/",
      },
      {
        directory: path.join(__dirname, "dist"),
        publicPath: "/dist",
      },
    ],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts"],
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
    publicPath: "",
    library: {
      type: "module",
    },
  },
};
