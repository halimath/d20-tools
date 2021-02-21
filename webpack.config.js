const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
    mode: "development",
    entry: {
        diceroller: "./src/diceroller/index.ts",
        grid: "./src/grid/index.ts",
        foes: "./src/foes/index.ts",
    },
    output: {
        filename: "[name].js"
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
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    "sass-loader",
                ],
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin()
    ],
    resolve: {
        extensions: [".ts", ".js", ".html"],
        plugins: [new TsconfigPathsPlugin()]
    },
    devServer: {
        contentBase: "./public",
        staticOptions: {
            extensions: ["html"],
        },
        host: "0.0.0.0",
        compress: true,
        port: 9999,
    }
}