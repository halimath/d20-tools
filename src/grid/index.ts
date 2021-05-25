import * as wecco from "@weccoframework/core"
import { load } from "src/common/i18n"
import { update } from "./controller"
import { createId, GameGrid, Model } from "./models"
import { Browser } from "../common/browser"
import { root } from "./views"

import "./index.sass"
import { loadGameGrid } from "./store"

document.addEventListener("DOMContentLoaded", async () => {
    await load()
       
    wecco.app(async () => {
        if (Browser.urlHash) {
            if (Browser.urlHash.indexOf("/") > 0) {
                return new Model(GameGrid.fromDescriptor(createId(), "", Browser.urlHash), false)
            } else {
                return loadGameGrid(Browser.urlHash)
                    .then(g => new Model(g, false))
                    .catch(e => {
                        console.error(e)
                        Browser.urlHash = ""
                        return new Model(GameGrid.createInitial(), false)
                    })
            }
        } else {
            return new Model(GameGrid.createInitial(), false)
        }
    
    }, update, root, "#app")    
})
