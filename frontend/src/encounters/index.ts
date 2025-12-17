import * as wecco from "@weccoframework/core"
import { load } from "src/common/i18n"
import { update } from "./controller"
import "./index.sass"
import { Model } from "./models"
import { loadCharacters, loadKinds } from "./store"
import { root } from "./views"

document.addEventListener("DOMContentLoaded", async () => {
    await load()
    wecco.createApp(loadModel, update, root).mount("#app")
})

async function loadModel(): Promise<Model> {
    const kinds = await loadKinds()
    const characters = await loadCharacters(kinds)
    
    return new Model(kinds, characters, 0, "characters", "roll")
}
