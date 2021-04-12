import * as wecco from "@wecco/core"
import { Browser } from "src/common/browser"
import { update } from "./controller"
import "./index.sass"
import { Attack, Damage, Kind, Model, Roll } from "./models"
import { root } from "./views"

document.addEventListener("DOMContentLoaded", async () => {
    wecco.app(createModel, update, root, "#app")
})

function createModel(): Model {
    const kinds = [
        new Kind("Scherge m/ Kurzschwert", {
            ac: 14,
            ini: 2,
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
        ),
        new Kind("Scherge m/ l. Armbrust", {
            ac: 14,
            ini: 2,
            speed: 6,
            hitDie: Roll.parse("2d8+2"),
            savingThrows: {
                reflex: 2,
                will: 0,
                fortitude: 1,
            },
            tags: ["Halb-Elf", "mittelgroß"]
        },
            new Attack("Leichte Armbrust", 3, new Damage("", Roll.parse("1w6"))),
        ),
        new Kind("Wolf/Leopard", {
            ac: 14,
            ini: 2,
            speed: 10,
            hitDie: Roll.parse("2d8+4"),
            savingThrows: {
                reflex: 5,
                will: 1,
                fortitude: 5,
            },
            tags: ["Tier", "mittelgroß"]
        },
            new Attack("Biss", 3, new Damage("", Roll.parse("1w6+1"))),
        ),

        new Kind("Zombie", {
            ac: 11,
            ini: -1,
            speed: 6,
            hitDie: Roll.parse("2d8+2"),
            savingThrows: {
                reflex: -1,
                will: 3,
                fortitude: 0,
            },
            tags: ["Halb-Elf", "mittelgroß"]
        },
            new Attack("Hieb", 2, new Damage("", Roll.parse("1w6+1"))),
        ),

        new Kind("Goblin", {
            ac: 15,
            ini: 1,
            speed: 6,
            hitDie: Roll.parse("1d8"),
            savingThrows: {
                reflex: 1,
                will: 0,
                fortitude: 2,
            },
            tags: ["Goblinoid", "klein"]
        },
            new Attack("Morgenstern", 1, new Damage("", Roll.parse("1w8-3"))),
        )
    ]

    // return new Model(kinds, [])
    return Model.fromUrlHash(Browser.urlHash, kinds)
}