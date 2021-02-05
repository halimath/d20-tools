const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin")

module.exports = {
    mode: "development",
    entry: {
        diceroller: "./src/diceroller/index.ts",
        grid: "./src/grid/index.ts",
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
        staticOptions: {
            extensions: ["html"],
        },
        host: "0.0.0.0",
        compress: true,
        port: 9999,
    }
}