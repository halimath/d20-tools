import * as wecco from "@wecco/core"
import { DiceRoller, DieType, GameGrid, Model } from "../models"

import { Browser } from "../utils/browser"

// Generic messages

export class Nop {
    readonly command = "nop"
}

// Navigational messages

export class ShowDiceRoller {
    readonly command = "show-dice-roller"
}

export class ShowGameGrid {
    readonly command = "show-game-grid"

    constructor(public readonly cols: number = 20, public readonly rows: number = 10) {}
}

// 

export class RollDie {
    readonly command = "roll-die"

    constructor(public readonly dieType: DieType) { }
}

export type Message = Nop | ShowDiceRoller | ShowGameGrid | RollDie

const UrlHashDiceRoller = "diceroller"
const UrlHashGameGrid = "gamegrid"

export function update(model: Model, message: Message, context: wecco.AppContext<Message>): Model {
    switch (message.command) {
        case "nop":
            console.warn("Got nop message")
            return model

        case "roll-die":
            if (!(model instanceof DiceRoller)) {
                console.error(`inconsistency detected: ${model} is not an instance of DiceRoller`)
                return model
            }
            return model.rollDie(message.dieType)

        case "show-dice-roller":
            Browser.urlHash = UrlHashDiceRoller
            return new DiceRoller([3, 4, 6, 8, 10, 12, 20, 100])

        case "show-game-grid":
            Browser.urlHash = UrlHashGameGrid
            return new GameGrid(message.cols, message.rows)
    }
}

export function executeRoute(context: wecco.AppContext<Message>, urlHash: string | null) {
    if (urlHash === UrlHashGameGrid) {
        context.emit(new ShowGameGrid())
        return
    }
    context.emit(new ShowDiceRoller())
}
