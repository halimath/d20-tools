import * as wecco from "@weccoframework/core"
import { Attack, Attribute, Character, InitiativeKind, Kind, Model, Tab } from "../models"
import { saveCharacters, saveKinds } from "../store"

export class Nop {
    readonly command = "nop"
}

export class Clear {
    readonly command = "clear"
}

export class SelectTab {
    readonly command = "select-tab"

    constructor (public readonly tab: Tab) {}
}

export class CreateNPC {
    readonly command = "create-npc"

    constructor (public readonly label: string, public readonly kind: Kind) {}
}

export class CreatePC {
    readonly command = "create-pc"

    constructor (public readonly label: string, public readonly ini: number) {}
}

export class RemoveCharacter {
    readonly command = "remove-character"

    constructor (public readonly character: Character) {}
}

export class PerformAttack {
    readonly command = "perform-attack"

    constructor(public readonly character: Character, public readonly attack: Attack) { }
}

export class RollAttribute {
    readonly command = "roll-attribute"

    constructor(public readonly character: Character, public readonly attribute: Attribute) { }
}

export class UpdateCurrentHitPoints {
    readonly command = "update-current-hitpoints"

    constructor(public readonly character: Character, public readonly delta: number) { }
}

export class SelectActiveCharacter {
    readonly command = "select-active-character"

    constructor(public readonly index: number) {}
}

export class SaveKind {
    readonly command = "save-kind"

    constructor(public readonly kind: Kind, public readonly index?: number) {}
}

export class RemoveKind {
    readonly command = "remove-kind"

    constructor(public readonly kind: Kind) {}
}

export class SwitchInitiativeKind {
    readonly command = "switch-initiative-kind"

    constructor (public readonly kind: InitiativeKind) {}
}

export type Message = Nop | Clear | SelectTab | CreateNPC | CreatePC | RemoveCharacter | PerformAttack 
    | RollAttribute | UpdateCurrentHitPoints | SelectActiveCharacter 
    | SaveKind | RemoveKind | SwitchInitiativeKind

export function update({model, message}: wecco.UpdaterContext<Model, Message>): Model | Promise<Model> {
    switch (message.command) {
        case "nop":
            return model

        case "clear":
            return save(model.clear())

        case "select-tab":
            return new Model(model.kinds, model.characters, model.activeCharacterIndex, message.tab, model.initiativeKind)

        case "create-npc":
            return save(model.createNPC(message.label, message.kind))

        case "create-pc":
            return save(model.createPC(message.label, message.ini))

        case "remove-character":
            return save(model.removeCharacter(message.character))

        case "perform-attack":
            return model.performAttach(message.character, message.attack)

        case "roll-attribute":
            return model.rollAttribute(message.character, message.attribute)

        case "update-current-hitpoints":
            return model.updateCurrentHitPoints(message.character, message.delta)

        case "select-active-character":
            return model.selectActiveCharacter(message.index)

        case "save-kind":
            if (typeof message.index !== "undefined") {
                return save(model.updateKind(message.index, message.kind))
            }
            return save(model.appendKind(message.kind))

        case "remove-kind":
            return save(model.removeKind(message.kind))

        case "switch-initiative-kind":
            return model.switchInitiativeKind(message.kind)

    }
}

function save(m: Model): Promise<Model> {
    return saveKinds(m.kinds)
        .then(() => saveCharacters(m.characters))
        .then(() => m)
}
