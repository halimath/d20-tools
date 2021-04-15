import * as models from "../models"
import { RollResult } from "../models"
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

function convertIni (ini: models.RollResult): dtos.Ini {
    return {
        dieResult: ini.dieResult,
        modifier: ini.modifier,
    }
}