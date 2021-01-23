import * as wecco from "@wecco/core"
import { Message } from "../controller"
import { DiceRoller, GameGrid, Model } from "../models"
import { diceRoller } from "./scenes/diceRoller"
import { gameGrid } from "./scenes/gameGrid"

export function root(model: Model, context: wecco.AppContext<Message>): wecco.ElementUpdate {
    if (model instanceof DiceRoller) {
        return diceRoller(context, model)
    }

    if (model instanceof GameGrid) {
        return gameGrid(context, model)
    }

    console.log("Got unhandled model", model)

    return ``
}

