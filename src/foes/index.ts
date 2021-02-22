import * as wecco from "@wecco/core"
import { Browser } from "src/common/browser"
import { update } from "./controller"
import "./index.sass"
import { Attack, Character, Damage, DieRoll, Model, Roll, Kind } from "./models"
import { root } from "./views"

document.addEventListener("DOMContentLoaded", async () => {
    wecco.app(createModel, update, root, "#app")
})

function createModel(): Model {
    const kinds = [
        new Kind("Scherge", {
            ac: 14,
            speed: 6,
            hitDie: Roll.parse("2d8+2"),
            savingThrows: {
                reflex: 2,
                will: 0,
                fortitude: 1,
            },
            tags: ["Halb-Elf", "mittelgroß"]
        },
        new Attack("vergiftetes Kurzschwert", 3, new Damage("", Roll.parse("1w6+1")), new Damage("Gift (KO)", Roll.parse("1w2"))),
        new Attack("Leichte Armbrust", 3, new Damage("", Roll.parse("1w6"))),
        )
    ]

    // return new Model(kinds, [])
    return Model.fromUrlHash(Browser.urlHash, kinds)
}