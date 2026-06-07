import { Attribute } from "../models"

export interface PC {
    type: "pc"
    label: string
    ini: number
}

export interface Ini {
    dieResult: number
    modifier: number
}

export interface NPC {
    type: "npc"
    label: string
    ini: Ini
    kind: string
    hp: number
    chp: number
}

export type Attributes = Record<Attribute, number>

export interface Damage {
    label: string
    damage: string
}

export interface Attack {
    label: string
    mod: number
    damage: Array<Damage>
}

export interface Kind {
    label: string
    speed: number 
    ac: number
    challengeRate?: number
    xp?: number
    hitDie: string
    attributes?: Attributes
    savingThrows?: Attributes
    attacks: Array<Attack>
}
