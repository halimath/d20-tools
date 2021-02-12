import * as wecco from "@wecco/core"
import { NextParticipant, update } from "./controller"
import "./index.sass"
import { Attack, Combat, NPC, Participant, PC, Roll } from "./models"
import { root } from "./views"


document.addEventListener("DOMContentLoaded", async () => {
    const app = wecco.app(() => Combat.create(
        new Participant(new PC("Nox"), 8),
        new Participant(new PC("Corvus"), 23),
        new Participant(new NPC("Zombie #1", {
            armorClass: 12,
            speed: 9,
            attacks: [ new Attack("Claw", +2, new Roll(4, +2)) ],
        }), 13),
    ), update, root, "#app")

    document.addEventListener("keypress", (e: KeyboardEvent) => {
        if (e.key === " ") {
            app.emit(new NextParticipant())
        }
    })
})
