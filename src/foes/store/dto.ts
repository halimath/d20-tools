export interface Ini {
    dieResult: number
    modifier: number
}

export interface PC {
    type: "pc"
    label: string
    ini: Ini
}

export interface NPC {
    type: "npc"
    label: string
    ini: Ini
    kind: string
    hp: number
    chp: number
}

export interface SavingThrows {
    reflex: number
    will: number
    fortitude: number
}

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
    ini: number
    hitDie: string
    savingThrows: SavingThrows
    tags: Array<string>
    attacks: Array<Attack>
}