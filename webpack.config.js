const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")

module.exports = {
    mode: "development",
    entry: "./src/script/index.ts",
    output: {
        filename: "script.js"
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: "ts-loader"
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    "style-loader",
                    "css-loader",
                    "sass-loader",
                ],
            }
        ]
    },
    resolve: {
        extensions: [".ts", ".js", ".html"],
        plugins: [new TsconfigPathsPlugin()]
    },
    devServer: {
        contentBase: "./public",
        host: "0.0.0.0",
        compress: true,
        port: 9999,
    }
}