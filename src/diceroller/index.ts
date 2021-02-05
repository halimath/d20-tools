import * as wecco from "@wecco/core"
import "./index.sass"
import { update } from "./controller"
import { root } from "./views"
import { Model } from "./models"


document.addEventListener("DOMContentLoaded", async () => {
    wecco.app(() => Model.createInitial(), update, root, "#app")
})
