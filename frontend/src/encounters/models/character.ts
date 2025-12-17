export type InitiativeKind = "roll" | "static"

export interface InitiativeResult {
    value(initiativeKind: InitiativeKind): number
}

export interface Character {
    label: string
    ini: InitiativeResult

    toJSON(): Record<string, unknown>
}

export class PC implements Character {
    constructor (public readonly label: string, public readonly iniValue: number) {}

    get ini(): InitiativeResult {
        return {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            value: (_: InitiativeKind): number => this.iniValue 
        }
    }

    toJSON(): Record<string, unknown> {
        return {
            "type": "pc",
            "label": this.label,
            "ini": this.ini,
        }
    }
} 