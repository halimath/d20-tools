# d20-tools

A PWA with some tools for playing D20 based role playing games. 

You can use these tools live at [d20-tools.wilanthaou.de](https://d20-tools.wilanthaou.de).

## Features

D20 Tools features:

* A **Dice Roller** which allows you to roll any die required for playing D20 based games.
* A scalable **Game Grid** which can help organize combats.

## Development

`d20-tools` is built using 

* [TypeScript](https://www.typescriptlang.org/)
* [wecco](https://wecco.bitbucket.io/)
* [sass](https://sass-lang.com/)
* [webpack](https://wecco.bitbucket.io/)

Everything can be installed using `npm`. To get started you need to have a working 
installation of _nodejs_ and _npm_.

Run

```
$ npm i
```

to install all dependencies. Run

```
$ npm start
```

to launch the webpack dev server, then open [localhost:9999](http://localhost:9999) in
your favorite browser.

### Generating the icons

The icon is maintained as `icon.svg`. To generate a PNG version, we use `inkscape` with
the following command:

```
$ inkscape icon.svg -w 48 --export-filename public/icon.png
$ inkscape icon.svg -w 32 --export-filename public/favicon.png
```

Make sure to commit the generated files to git when changing the SVG.

## License

This project is licensed under the Apache License V2.