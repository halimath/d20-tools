export * from "./character"
export * from "./npc"
export * from "./roll"

import { Character, PC } from "./character"
import { Attack, Kind, NPC, SavingThrow } from "./npc"
import { RollResult } from "./roll"

export type Tab = "characters" | "kinds"

export class Model {
    constructor(
        public readonly kinds: Array<Kind>,
        public readonly characters: Array<Character>,
        public readonly activeCharacterIndex: number = 1,
        public readonly tab: Tab = "characters",
    ) { 
        this.characters.sort((a, b) => b.ini.value - a.ini.value)
    }

    createNPC(label: string, kind: Kind): Model {
        const characters = this.characters.slice()
        characters.push(NPC.create(label, kind))
        characters.sort((a, b) => b.ini.value - a.ini.value)

        return new Model(this.kinds, characters, this.activeCharacterIndex)
    }

    createPC(label: string, ini: RollResult): Model {
        const characters = this.characters.slice()
        characters.push(new PC(label, ini))
        characters.sort((a, b) => b.ini.value - a.ini.value)

        return new Model(this.kinds, characters, this.activeCharacterIndex)
    }

    removeCharacter(character: Character): Model {
        const idx = this.characters.findIndex(c => c === character)
        if (idx < 0) {
            throw `invalid character: ${character}`
        }
        const characters = this.characters.slice()
        characters.splice(idx, 1)

        return new Model(this.kinds, characters, this.activeCharacterIndex, this.tab)
    }

    rollSavingThrow(character: Character, savingThrow: SavingThrow): Model {
        if (!(character instanceof NPC)) {
            return this
        }

        const idx = this.characters.findIndex(c => c === character)
        if (idx < 0) {
            throw `invalid character: ${character}`
        }

        let characters = this.characters.slice(0, idx)
        characters.push(character.rollSavingThrow(savingThrow))
        characters = characters.concat(this.characters.slice(idx + 1))

        return new Model(this.kinds, characters, this.activeCharacterIndex, this.tab)
    }

    performAttach(character: Character, attack: Attack): Model {
        if (!(character instanceof NPC)) {
            return this
        }

        const idx = this.characters.findIndex(c => c === character)
        if (idx < 0) {
            throw `invalid character: ${character}`
        }

        let characters = this.characters.slice(0, idx)
        characters.push(character.performAttack(attack))
        characters = characters.concat(this.characters.slice(idx + 1))

        return new Model(this.kinds, characters, this.activeCharacterIndex, this.tab)
    }

    updateCurrentHitPoints(character: Character, delta: number): Model {
        if (!(character instanceof NPC)) {
            return this
        }

        const idx = this.characters.findIndex(c => c === character)
        if (idx < 0) {
            throw `invalid character: ${character}`
        }

        let characters = this.characters.slice(0, idx)
        characters.push(character.updateCurrentHitPoints(delta))
        characters = characters.concat(this.characters.slice(idx + 1))

        return new Model(this.kinds, characters, this.activeCharacterIndex, this.tab)
    }

    selectActiveCharacter(index: number): Model {
        if (index < 0 || index >= this.characters.length) {
            return this
        }
        return new Model(this.kinds, this.characters, index, this.tab)
    }

    clear(): Model {
        return new Model(this.kinds, [], 0, this.tab)
    }
}
