import * as wecco from "@weccoframework/core"
import { DieType, Model } from "../models"

export class RollDie {
    constructor(public readonly dieType: DieType) { }
}

export type Message = RollDie | "clearHistory"

export function update({model, message}: wecco.UpdaterContext<Model, Message>): Model {
    console.log(message)
    if (message === "clearHistory") {
        return model.clearHistory()
    }
    return model.rollDie(message.dieType)
}
