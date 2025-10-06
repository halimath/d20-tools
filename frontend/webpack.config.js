const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require("terser-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")

module.exports = {
    mode: "development",
    entry: {
        diceroller: "./src/diceroller/index.ts",
        grid: "./src/grid/index.ts",
        encounters: "./src/encounters/index.ts",
    },
    output: {
        filename: "[name].[contenthash].js"
    },
    performance: {
        hints: false,
        maxEntrypointSize: 300000,
        maxAssetSize: 300000
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false
            }),
        ],
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
                    {
                        loader: 'sass-loader',
                        options: {
                            sassOptions: {
                                silenceDeprecations: [ 'color-functions', 'global-builtin', 'import'],
                            }
                        }
                    }
                ],
            }
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',

        }),
        new HtmlWebpackPlugin({
            template: './src/common/index.html',
            filename: 'index.html',
            chunks: ['diceroller'],
        }),
        new HtmlWebpackPlugin({
            template: './src/common/index.html',
            filename: 'encounters/index.html',
            chunks: ['encounters'],
        }),
        new HtmlWebpackPlugin({
            template: './src/common/index.html',
            filename: 'grid/index.html',
            chunks: ['grid'],
        }),
    ],
    resolve: {
        extensions: [".ts", ".js", ".html"],
        plugins: [new TsconfigPathsPlugin()]
    },
    devServer: {
        static: {
            directory: "./public",
            serveIndex: true,
        },
        host: "0.0.0.0",
        compress: true,
        port: 9999,
    }
}
