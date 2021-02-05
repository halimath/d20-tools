import * as wecco from "@wecco/core"
import { DieType, Model } from "../models"


export class Message {
    constructor(public readonly dieType: DieType) { }
}

export function update(model: Model, message: Message, context: wecco.AppContext<Message>): Model {
    return model.rollDie(message.dieType)
}
