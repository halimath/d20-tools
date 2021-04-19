import * as wecco from "@wecco/core"
import { Browser } from "src/common/browser"
import { update } from "./controller"
import "./index.sass"
import { Model, Tab } from "./models"
import { loadCharacters, loadKinds } from "./store"
import { root } from "./views"

document.addEventListener("DOMContentLoaded", () => {
    wecco.app(loadModel, update, root, "#app")
})

async function loadModel(): Promise<Model> {
    let tab: Tab = "characters"
    const hash = Browser.urlHash
    if (hash === "kinds") {
        tab = "kinds"
    }
    Browser.urlHash = tab

    const kinds = await loadKinds()
    const characters = await loadCharacters(kinds)
    
    return new Model(kinds, characters, 0, tab)
}
