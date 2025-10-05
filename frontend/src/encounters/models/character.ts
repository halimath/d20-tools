import { RollResult } from "./roll";

export interface Character {
    label: string
    ini: RollResult

    toJSON(): Record<string, unknown>
}

export class PC implements Character {
    constructor (public readonly label: string, public readonly ini: RollResult) {}

    toJSON(): Record<string, unknown> {
        return {
            "type": "pc",
            "label": this.label,
            "ini": this.ini,
        }
    }
} 