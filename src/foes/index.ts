import * as wecco from "@weccoframework/core"
import { Browser } from "src/common/browser"
import { load } from "src/common/i18n"
import { update } from "./controller"
import "./index.sass"
import { Model, Tab } from "./models"
import { loadCharacters, loadKinds } from "./store"
import { root } from "./views"

document.addEventListener("DOMContentLoaded", async () => {
    await load()
    wecco.createApp(loadModel, update, root).mount("#app")
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
