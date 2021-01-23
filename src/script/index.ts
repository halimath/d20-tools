import * as wecco from "@wecco/core"

import "../styles/index.sass"

import { executeRoute, ShowDiceRoller, update } from "./controller"
import { Browser } from "./utils/browser"
import { root } from "./views"

document.addEventListener("DOMContentLoaded", async () => {
    const app = wecco.app(() => null, update, root, "#app")

    executeRoute(app, Browser.urlHash)
})
