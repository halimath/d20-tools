import * as wecco from "@wecco/core"
import { update } from "./controller"
import "./index.sass"
import { Model } from "./models"
import { loadCharacters, loadKinds } from "./store"
import { root } from "./views"

document.addEventListener("DOMContentLoaded", () => {
    wecco.app(loadModel, update, root, "#app")
})

async function loadModel(): Promise<Model> {
    const kinds = await loadKinds()
    const characters = await loadCharacters(kinds)
    return new Model(kinds, characters)
}
