import { Character, InitiativeKind, InitiativeResult } from "./character"
import { DieRoll, Roll, RollResult } from "./roll"

export class HitDamage {
    constructor (public readonly label: string, public readonly result: RollResult) {}
}

export class Hit {
    constructor (public readonly ac: RollResult, public readonly damage: Array<HitDamage>) {}
}

export class Damage {
    constructor (public readonly label: string, public readonly damage: Roll) {}

    roll(): HitDamage {
        return new HitDamage(this.label, this.damage.roll())
    }
}

export class Attack {
    public readonly roll: Roll
    public readonly damage: Array<Damage>

    constructor(public readonly label: string, public readonly mod: number, ...damage: Array<Damage>) { 
        this.roll = new Roll(new DieRoll(20), this.mod)
        this.damage = damage
    }

    execute(): Hit {
        return new Hit(this.roll.roll(), this.damage.map(d => d.roll()))
    }
}

export type Attribute = "str" | "dex" | "con" | "int" | "wis" | "cha"

export const AttributeKeys: Array<Attribute> = ["str", "dex", "con", "int", "wis", "cha"]

export type Attributes<T> = Record<Attribute, T>

export interface KindOptions {
    ac: number
    speed: number
    challengeRate: number
    xp: number
    attributes: Attributes<number>
    hitDie: Roll
    attacks?: Array<Attack>
}

export class Kind {
    static empty(): Kind {
        return new Kind("", {
            speed: 6,
            ac: 10,
            challengeRate: 1,
            xp: 200,
            hitDie: Roll.parse("1d4"),
            attributes: {
                str: 0,
                dex: 0,
                con: 0,
                int: 0,
                wis: 0,
                cha: 0,
            },
        })
    }

    public readonly speed: number 
    public readonly ac: number
    public readonly challengeRate: number
    public readonly xp: number
    public readonly hitDie: Roll
    public readonly attributes: Attributes<number>
    public readonly attacks: Array<Attack>

    constructor (    
        public readonly label: string,
        options: KindOptions,
        ...attacks: Array<Attack>
    ) {
        this.speed = options.speed
        this.ac = options.ac
        this.challengeRate = options.challengeRate
        this.xp = options.xp
        this.hitDie = options.hitDie
        this.attributes = {
            str: options.attributes.str,
            dex: options.attributes.dex,
            con: options.attributes.con,
            int: options.attributes.int,
            wis: options.attributes.wis,
            cha: options.attributes.cha,
        }
        this.attacks = (options.attacks ?? []).concat(attacks)
    }

    rollIni(): RollResult {
        return new Roll(new DieRoll(20), this.attributes.dex).roll()
    }
}

export class IniRollResult implements InitiativeResult {
    constructor (public readonly rollResult: RollResult) {}

    value(initiativeKind: InitiativeKind): number {
        if (initiativeKind === "roll") {
            return this.rollResult.value
        }

        return 10 + this.rollResult.modifier
    }
}

export class NPC implements Character {
    static create (label: string, kind: Kind, hitpoints?: number, currentHitpoints?: number, ini?: RollResult): NPC {
        const hp = hitpoints ?? kind.hitDie.roll().value

        return new NPC(label, kind, ini ?? kind.rollIni(), hp, currentHitpoints ?? hp, kind.attacks.map(a => [a, undefined]), 
            Object.keys(kind.attributes).reduce((obj: unknown, attribute: Attribute) => {
                (obj as Record<Attribute, RollResult | undefined>)[attribute] = undefined
                return obj
            }, {}) as unknown as Record<Attribute, RollResult | undefined>
        )
    }    

    constructor(
        public readonly label: string, 
        public readonly kind: Kind, 
        private readonly initiativeRoll: RollResult,
        public readonly hitpoints: number, 
        public readonly currentHitpoints: number,
        public readonly attacks: Array<[Attack, Hit | undefined]>,
        public readonly attributes: Attributes<RollResult | undefined>,
    ) { }
    
    get isDead(): boolean {
        return this.currentHitpoints <= 0
    }

    get ini(): InitiativeResult {
        return new IniRollResult(this.initiativeRoll)
    }

    get iniRollResult(): RollResult {
        return this.initiativeRoll
    }

    rollAttribute(attribute: Attribute): NPC {
        const attributes: Attributes<RollResult | undefined> = {
            str: undefined,
            dex: undefined,
            con: undefined,
            int: undefined,
            wis: undefined,
            cha: undefined,
        }
        attributes[attribute] = Roll.create(1, 20, this.kind.attributes[attribute]).roll()

        return new NPC(this.label, this.kind, this.initiativeRoll, this.hitpoints, this.currentHitpoints, this.attacks, attributes)
    }

    performAttack(attack: Attack): NPC {
        const idx = this.attacks.findIndex(a => a[0] === attack)
        if (idx < 0) {
            throw `invalid attack: ${this} ${attack}`
        }
        let attacks = this.attacks.slice(0, idx)
        attacks.push([attack, attack.execute()])
        attacks = attacks.concat(this.attacks.slice(idx + 1))

        return new NPC(this.label, this.kind, this.initiativeRoll, this.hitpoints, this.currentHitpoints, attacks, this.attributes)
    }
    
    updateCurrentHitPoints (delta: number): NPC {
        return new NPC(this.label, this.kind, this.initiativeRoll, this.hitpoints, this.currentHitpoints + delta, this.attacks, this.attributes)
    }

    toUrlHash(): string {
        return [this.label, this.kind.label, this.hitpoints, this.currentHitpoints].join(";")
    }

    toJSON(): Record<string, unknown> {
        return {
            "type": "npc",
            "label": this.label,
            "kind": this.kind.label,
            "hp": this.hitpoints,
            "chp": this.currentHitpoints,
            "ini": this.ini,
        }
    }
}
