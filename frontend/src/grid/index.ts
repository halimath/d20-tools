import * as wecco from "@weccoframework/core"
import { load } from "src/common/i18n"
import { Browser } from "../common/browser"
import { update } from "./controller/controller"
import "./index.sass"
import { createId, GameGrid, Model } from "./models/models"
import { loadGameGrid } from "./store"
import { root } from "./views"


document.addEventListener("DOMContentLoaded", async () => {
    await load()

    const svgStencils = document.createElement("div")
    svgStencils.classList.add("hidden")
    document.body.appendChild(svgStencils)
    wecco.updateElement(svgStencils, wecco.html`
        <svg aria-hidden="true" style="position: absolute; width: 0; height: 0; overflow: hidden; display: none;"
            xmlns="http://www.w3.org/2000/svg" id="svg-defs">
            <symbol id="wall-top-wall">
                <path d="M 0 0 l 10 0" />
            </symbol>

            <symbol id="background" viewbox="0 0 10 10">
                <path d="M 2 3 L 3 2 M 2 5 L 5 2 M 2 7 L 7 2 M 3 8 L 8 3 M 5 8 L 8 5 M 7 8 L 8 7" />
            </symbol>
        </svg>
    `)
       
    wecco.createApp(async () => {
        if (Browser.urlHash) {
            if (Browser.urlHash.indexOf("/") > 0) {
                return new Model(GameGrid.fromDescriptor(createId(), "", Browser.urlHash))
            } else {
                return loadGameGrid(Browser.urlHash)
                    .then(g => new Model(g))
                    .catch(e => {
                        console.error(e)
                        Browser.urlHash = ""
                        return new Model(GameGrid.createInitial())
                    })
            }
        } else {
            return new Model(GameGrid.createInitial())
        }
    
    }, update, root).mount("#app")    
})
