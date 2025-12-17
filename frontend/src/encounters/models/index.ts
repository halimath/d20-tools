export * from "./character"
export * from "./npc"
export * from "./roll"

import { Character, InitiativeKind, PC } from "./character"
import { Attack, Kind, NPC, SavingThrow } from "./npc"

export type Tab = "characters" | "kinds"


export class Model {
    constructor(
        public readonly kinds: Array<Kind>,
        public readonly characters: Array<Character>,
        public readonly activeCharacterIndex: number,
        public readonly tab: Tab,
        public readonly initiativeKind: InitiativeKind,
    ) { 
        this.kinds.sort((a, b) => a.label.localeCompare(b.label))
        this.sortCharacters(this.characters, this.initiativeKind)
    }

    createNPC(label: string, kind: Kind): Model {
        const characters = this.characters.slice()
        if (!label) {
            const count = characters.filter(c => (c instanceof NPC) && c.kind === kind).length
            label = `${kind.label} #${count + 1}`
        }

        characters.push(NPC.create(label, kind))
        this.sortCharacters(characters, this.initiativeKind)

        return new Model(this.kinds, characters, this.activeCharacterIndex, this.tab, this.initiativeKind)
    }

    createPC(label: string, ini: number): Model {
        const characters = this.characters.slice()
        characters.push(new PC(label, ini))
        this.sortCharacters(characters, this.initiativeKind)

        return new Model(this.kinds, characters, this.activeCharacterIndex, this.tab, this.initiativeKind)
    }

    private sortCharacters(characters: Array<Character>, kind: InitiativeKind) {
        characters.sort((a, b) => b.ini.value(kind) - a.ini.value(kind))
    }

    removeCharacter(character: Character): Model {
        const idx = this.characters.findIndex(c => c === character)
        if (idx < 0) {
            throw `invalid character: ${character}`
        }
        const characters = this.characters.slice()
        characters.splice(idx, 1)

        return new Model(this.kinds, characters, this.activeCharacterIndex, this.tab, this.initiativeKind)
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

        return new Model(this.kinds, characters, this.activeCharacterIndex, this.tab, this.initiativeKind)
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

        return new Model(this.kinds, characters, this.activeCharacterIndex, this.tab, this.initiativeKind)
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

        return new Model(this.kinds, characters, this.activeCharacterIndex, this.tab, this.initiativeKind)
    }

    selectActiveCharacter(index: number): Model {
        if (index < 0 || index >= this.characters.length) {
            return this
        }
        return new Model(this.kinds, this.characters, index, this.tab, this.initiativeKind)
    }

    clear(): Model {
        return new Model(this.kinds, [], 0, this.tab, this.initiativeKind)
    }

    updateKind(index: number, k: Kind): Model {
        const kinds = this.kinds.slice()
        kinds[index] = k
        // TODO: Check if we need to upgrade characters
        return new Model(kinds, this.characters, this.activeCharacterIndex, this.tab, this.initiativeKind)
    }

    appendKind(k: Kind): Model {
        const kinds = this.kinds.slice()
        kinds.push(k)
        return new Model(kinds, this.characters, this.activeCharacterIndex, this.tab, this.initiativeKind)
    }

    removeKind(kind: Kind): Model {
        const idx = this.kinds.findIndex(k => k === kind)
        if (idx === -1) {
            return this
        }
        return new Model(this.kinds.slice(0, idx).concat(this.kinds.slice(idx + 1)), 
            this.characters, this.activeCharacterIndex, this.tab, this.initiativeKind)
    }

    switchInitiativeKind(initiativeKind: InitiativeKind): Model {
        if (initiativeKind === this.initiativeKind) {
            return this
        }

        return new Model(this.kinds, this.characters, this.activeCharacterIndex, this.tab, initiativeKind)
    }
}
