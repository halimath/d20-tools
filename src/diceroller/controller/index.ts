import * as wecco from "@weccoframework/core"
import { DieType, Model } from "../models"

export class Message {
    constructor(public readonly dieType: DieType) { }
}

export function update({model, message}: wecco.UpdaterContext<Model, Message>): Model {
    return model.rollDie(message.dieType)
}
