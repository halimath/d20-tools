import * as wecco from "@wecco/core"
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
            reflex: Roll.parse("1d20+2"),
            will: Roll.parse("1d20"),
            fortitude: Roll.parse("1d20+1"),
            tags: ["Halb-Elf", "mittelgroß"]
        },
        new Attack("Kurzschwert", 3, new Damage("", Roll.parse("1w6+1"))),
        new Attack("Leichte Armbrust", 3, new Damage("", Roll.parse("1w6"))),
        )
    ]

    return new Model(kinds, [])
}