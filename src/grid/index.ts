import * as wecco from "@weccoframework/core"
import { load } from "src/common/i18n"
import { update } from "./controller"
import "./index.sass"
import { GameGrid } from "./models"
import { Browser } from "./utils/browser"
import { root } from "./views"

document.addEventListener("DOMContentLoaded", async () => {
    await load()
    wecco.app(() => GameGrid.fromUrlHash(Browser.urlHash), update, root, "#app")    
})
