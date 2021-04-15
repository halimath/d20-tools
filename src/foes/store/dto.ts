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