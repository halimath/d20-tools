import { range } from "src/common/tools"

export interface Character {
    readonly label: string
}

export class PC implements Character {    
    constructor (public readonly name: string) {}

    get label(): string {
        return this.name
    }
}

export type DieType = 3 | 4 | 6 | 8 | 10 | 12 | 20 | 100

export class Roll {
    constructor (public readonly die: DieType, public readonly modifier: number) {}

    toString(): string {
        const s = `1d${this.die}`

        if (this.modifier === 0) {
            return s
        }

        if (this.modifier < 0) {
            return s + this.modifier
        }

        return `${s}+${this.modifier}`
    }
}

export class Attack {
    constructor (public readonly label: string, public readonly mod: number, public readonly damage: Roll) {}
}

export interface NPCAttributes {
    armorClass: number
    speed: number
    attacks: Array<Attack> 
}

export class NPC implements Character {
    public readonly attributes: NPCAttributes
    constructor (public readonly label: string, attributes?: Partial<NPCAttributes>){
        this.attributes = {
            armorClass: attributes?.armorClass ?? 0,
            speed: attributes?.speed ?? 0,
            attacks: attributes?.attacks ?? [],
        }
    }
}

export class Round {}

export class Participant {
    constructor(public readonly character: Character, public readonly initiative: number) {}
}

export class Combat {
    static create(...participants: Array<Participant>): Combat {
        return new Combat(participants, -1, [...range(participants.length)].map(() => [])).nextParticipant()
    }

    readonly participants: Array<Participant>
    
    private constructor (participants: Array<Participant>, public readonly activeParticipant: number, private readonly rounds: Array<Array<Round>>) {
        this.participants = participants.sort((a, b) => b.initiative - a.initiative)
    }

    nextParticipant(): Combat {
        const nextActiveParticipant = (this.activeParticipant + 1) % this.participants.length
        const rounds = this.rounds.slice()
        rounds[nextActiveParticipant].push(new Round())
        return new Combat(this.participants, nextActiveParticipant, rounds)
    }

    roundsForParticipant(participantIndex: number): Array<Round> {
        return this.rounds[participantIndex]
    }

    get numberOfRounds(): number {
        return this.rounds.reduce((max, r) => Math.max(max, r.length), 0)
    }
}

export type Model = Combat