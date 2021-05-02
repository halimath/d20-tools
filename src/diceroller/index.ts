import * as wecco from "@weccoframework/core"
import "./index.sass"
import { update } from "./controller"
import { root } from "./views"
import { Model } from "./models"
import { load } from "src/common/i18n"


document.addEventListener("DOMContentLoaded", async () => {
    await load()
    wecco.app(() => Model.createInitial(), update, root, "#app")
})
