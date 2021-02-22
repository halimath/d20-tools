import { Browser } from "src/common/browser"
import { Attack, Character, Kind, Model, Tab } from "../models"

export class Nop {
    readonly command = "nop"
}

export class SelectTab {
    readonly command = "select-tab"

    constructor (public readonly tab: Tab) {}
}

export class CreateCharacter {
    readonly command = "create-character"

    constructor (public readonly label: string, public readonly kind: Kind) {}
}

export class RemoveCharacter {
    readonly command = "remove-character"

    constructor (public readonly character: Character) {}
}

export class PerformAttack {
    readonly command = "perform-attack"

    constructor(public readonly character: Character, public readonly attack: Attack) { }
}

export class UpdateCurrentHitPoints {
    readonly command = "update-current-hitpoints"

    constructor(public readonly character: Character, public readonly delta: number) { }
}

export type Message = Nop | SelectTab | CreateCharacter | RemoveCharacter | PerformAttack | UpdateCurrentHitPoints

export function update(model: Model, message: Message): Model {
    const m = applyUpdate(model, message)
    Browser.urlHash = m.toUrlHash()
    return m
}

function applyUpdate(model: Model, message: Message): Model {
    switch (message.command) {
        case "nop":
            return model

        case "select-tab":
            return new Model(model.kinds, model.characters, message.tab)

        case "create-character":
            return model.createCharacter(message.label, message.kind)

        case "remove-character":
            return model.removeCharacter(message.character)

        case "perform-attack":
            return model.performAttach(message.character, message.attack)

        case "update-current-hitpoints":
            return model.updateCurrentHitPoints(message.character, message.delta)
    }
}