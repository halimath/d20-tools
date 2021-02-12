import { Model } from "../models"

export class Nop {
    readonly command = "nop"
}

export class NextParticipant {
    readonly command = "next-participant"
}

export type Message = Nop | NextParticipant

export function update(model: Model, message: Message): Model {
    switch (message.command) {
        case "next-participant":
            return model.nextParticipant()
        case "nop":
            return model
    }
}