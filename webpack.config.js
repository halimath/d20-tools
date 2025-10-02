const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
    mode: "development",
    entry: {
        diceroller: "./src/diceroller/index.ts",
        grid: "./src/grid/index.ts",
        encounters: "./src/encounters/index.ts",
    },
    output: {
        filename: "[name].js"
    },
    performance: {
        hints: false,
        maxEntrypointSize: 300000,
        maxAssetSize: 300000
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
        new MiniCssExtractPlugin()
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
