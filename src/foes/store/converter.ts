import * as models from "../models"
import { Kind, Roll, RollResult } from "../models"
import * as dtos from "./dto"

export function convertCharacter(c: models.Character): dtos.PC | dtos.NPC {
    if (c instanceof models.PC) {
        return convertPC(c)
    }

    if (c instanceof models.NPC) {
        return convertNPC(c)
    }

    throw `illegal character: ${c}`
}

function convertPC (pc: models.PC): dtos.PC {
    return {
        type: "pc",
        label: pc.label,
        ini: convertIni(pc.ini),
    }
}

function convertNPC (npc: models.NPC): dtos.NPC {
    return {
        type: "npc",
        label: npc.label,
        kind: npc.kind.label,
        hp: npc.hitpoints,
        chp: npc.currentHitpoints,
        ini: convertIni(npc.ini),
    }
}

export function reconstructCharacter(dto: dtos.PC | dtos.NPC, kinds: Array<models.Kind>): models.Character {
    if (dto.type === "pc") {
        return new models.PC(dto.label, new RollResult(dto.ini.dieResult, dto.ini.modifier))
    }

    const kind = kinds.find(k => k.label === dto.kind)
    
    if (!kind) {
        throw `kind not found: ${dto.kind}`
    }

    return models.NPC.create(dto.label, kind, dto.hp, dto.chp, new RollResult(dto.ini.dieResult, dto.ini.modifier))
}

export function reconstructKind(dto: dtos.Kind): models.Kind {
    return new models.Kind(dto.label, {
        tags: dto.tags,
        ac: dto.ac,
        ini: dto.ini, 
        speed: dto.speed, 
        hitDie: Roll.parse(dto.hitDie),
        savingThrows: {
            str: dto.savingThrows.str,
            dex: dto.savingThrows.dex,
            con: dto.savingThrows.con,
            int: dto.savingThrows.int,
            wis: dto.savingThrows.wis,
            cha: dto.savingThrows.cha,
        }
    }, ...dto.attacks.map(a => new models.Attack(a.label, a.mod, ...a.damage.map(d => new models.Damage(d.label, Roll.parse(d.damage))))))
}

export function convertKind (kind: models.Kind): dtos.Kind {
    return {
        label: kind.label,
        ac: kind.ac,
        ini: kind.ini,
        speed: kind.speed,
        hitDie: kind.hitDie.toString(),
        tags: kind.tags.slice(),
        savingThrows: {            
            str: kind.savingThrows.str,
            dex: kind.savingThrows.dex,
            con: kind.savingThrows.con,
            int: kind.savingThrows.int,
            wis: kind.savingThrows.wis,
            cha: kind.savingThrows.cha,
        },
        attacks: kind.attacks.map(a => {
            return {
                label: a.label,
                mod: a.mod,
                damage: a.damage.map(d => {
                    return {
                        label: d.label,
                        damage: d.damage.toString(),
                    }
                })
            }
        }),
    }
}

function convertIni (ini: models.RollResult): dtos.Ini {
    return {
        dieResult: ini.dieResult,
        modifier: ini.modifier,
    }
}