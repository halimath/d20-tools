import * as wecco from "@weccoframework/core"
import "./index.sass"
import { Message, update } from "./controller"
import { root } from "./views"
import { Model } from "./models"
import { load } from "src/common/i18n"


document.addEventListener("DOMContentLoaded", async () => {
    await load()
    wecco.createApp<Model, Message>(() => Model.createInitial(), update, root).mount("#app")
})
