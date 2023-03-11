const path = require("path");

module.exports = {
  target: "node",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    libraryTarget: "commonjs"
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader"
        }
      }
    ]
  },
  externals: [{ pg: { commonjs: "pg" } }, "pg-hstore"],
  resolve: {
    extensions: [".ts", ".js"]
  },
  mode: "production"
};
