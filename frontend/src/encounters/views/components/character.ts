import * as wecco from "@weccoframework/core"
import { Message, PerformAttack, RemoveCharacter, RollAttribute, SelectActiveCharacter, UpdateCurrentHitPoints } from "../../controller"
import { m } from "d20-tools/common/i18n"
import { Attack, Attribute, Character, Hit, Model, NPC, PC } from "../../models"


export function characters(model: Model, emit: wecco.MessageEmitter<Message>): wecco.ElementUpdate {
    if (model.characters.length === 0) {
        return wecco.html`<p class="lead text-center mt-4">${m("encounters.noCharacters")}</p>`
    }

    return model.characters.map((c, idx) => wecco.html`<div class="col-12" @click=${() => emit(new SelectActiveCharacter(idx))}>${character(emit, model, c, idx === model.activeCharacterIndex)}</div>`)
}

export function character (emit: wecco.MessageEmitter<Message>, model: Model, character: Character, active: boolean): wecco.ElementUpdate {
    if (character instanceof NPC) {
        return npc(emit, model, character, active)
    }

    return pc(emit, model, character as PC, active)
}

function pc(emit: wecco.MessageEmitter<Message>, model: Model, pc: PC, active: boolean): wecco.ElementUpdate {
    return wecco.html`
        <div class="mt-2 mb-2 card character pc shadow-sm ${active ? "active" : ""}">
            <div class="card-body">
                <div class="row">
                    <div class="col">
                        ${m("encounters.ini")}: <strong>${pc.ini.value(model.initiativeKind)}</strong>
                    </div>
                    <div class="col-6">
                        <h5 class="card-title">${pc.label}</h5>
                    </div>
                </div>
                <div class="row">
                    <div class="col text-end">
                        <button class="btn btn-outline-danger" @click+stopPropagation=${() => emit(new RemoveCharacter(pc))}><i class="material-icons">close</i></button>
                    </div>
                </div>
            </div>
        </div>`
}

function npc (emit: wecco.MessageEmitter<Message>, model: Model, npc: NPC, active: boolean): wecco.ElementUpdate {
    return wecco.html`
        <div class="mt-2 mb-2 card character npc shadow-sm ${active ? "active" : ""} ${npc.isDead ? "dead": ""}">
            <div class="card-body">                
                <div class="d-flex">
                    <div class="flex-shrink">
                        ${m("encounters.ini")}: <strong>${npc.ini.value(model.initiativeKind)}</strong>
                    </div>
                    <div class="text-center flex-grow-1">
                        <h5 class="card-title">${npc.label} <span class="badge text-bg-secondary">${npc.kind.label}</span></h5>
                    </div>
                    <div class="text-end">
                        <span class="me-3">${m("encounters.cr")}: <strong>${npc.kind.challengeRate}</strong></span>
                        <span class="me-2">${m("encounters.xp")}: <strong>${npc.kind.xp}</strong></span>
                    </div>
                </div>
                <div class="row">
                    <div class="col d-flex flex-column align-items-center justify-content-center">
                        <div class="d-flex flex-row align-items-center justify-content-center mt-2">
                            <div class="me-2 attribute speed">${npc.kind.speed}</div>
                            <div class="attribute ac">${npc.kind.ac}</div>
                        </div>
                        <div class="mt-2 attribute hp">${npc.currentHitpoints}</div>
                        <div class="mt-2 d-flex align-items-center justify-content-center">
                            ${m("encounters.hp")}:
                            <strong class=${npc.currentHitpoints <= 0 ? "text-danger" : ""}>${npc.currentHitpoints}</strong> / ${npc.hitpoints} (${npc.kind.hitDie})
                        </div>
                        <div class="mt-2 d-flex align-items-center justify-content-center">
                            <div class="btn-group ms-1">
                                <button class="btn btn-sm btn-outline-danger" @click+stopPropagation=${() => emit(new UpdateCurrentHitPoints(npc, -5))}>-5</button>
                                <button class="btn btn-sm btn-outline-danger" @click+stopPropagation=${() => emit(new UpdateCurrentHitPoints(npc, -1))}>-1</button>
                                <button class="btn btn-sm btn-outline-success" @click+stopPropagation=${() => emit(new UpdateCurrentHitPoints(npc, 1))}>+1</button>
                                <button class="btn btn-sm btn-outline-success" @click+stopPropagation=${() => emit(new UpdateCurrentHitPoints(npc, 5))}>+5</button>
                            </div>                                
                        </div>
                    </div>
                    <div class="col-8">
                        <div>
                            ${Object.keys(npc.kind.attributes).map((attribute: Attribute) => wecco.html`
                            <div class="mt-2 me-2 w-auto text-center d-inline-block">
                                <button class="btn ${npc.attributes[attribute] ? "btn-secondary" : "btn-outline-secondary"}" @click+stopPropagation=${() => emit(new RollAttribute(npc, attribute))}>
                                    ${m(`encounters.attribute.${attribute}`)}
                                    ${npc.attributes[attribute] ? ` = ${npc.attributes[attribute]?.value}` : `: ${modifier(npc.kind.attributes[attribute])}`}                                
                                </button>
                            </div>
                            `)}
                            </div>
                        ${npc.attacks.map(a => wecco.html`
                        <div class="mt-2">
                            ${attack(emit, npc, a[0])}
                            ${hit(a[1])}
                        </div>
                        `)}
                    </div>
                </div>                
                <div class="row">
                    <div class="col text-end">
                        <button class="btn btn-outline-danger" @click+stopPropagation=${() => emit(new RemoveCharacter(npc))}><i class="material-icons">close</i></button>
                    </div>
                </div>
            </div>
        </div>
    `
}

function hit(hit: Hit | undefined): wecco.ElementUpdate {
    if (typeof hit === "undefined") {
        return ""
    }

    let acBg = ""
    if (hit.ac.dieResult === 1) {
        acBg = "bg-danger"
    } else if (hit.ac.dieResult === 20) {
        acBg = "bg-success"
    }

    return wecco.html`
        <span class="badge ac ${acBg}">${m("encounters.ac")} ${hit.ac.value}</span>
        ${hit.damage.map(d => wecco.html`<span class="badge hp me-1">${d.label ? `${d.label}: ${d.result.value}` : d.result.value}</span>`)}
    `
}

function attack(emit: wecco.MessageEmitter<Message>, npc: NPC, attack: Attack): wecco.ElementUpdate {
    return wecco.html`
        <button class="btn btn-outline-primary" 
            ?disabled=${npc.currentHitpoints <= 0} 
            @click+stopPropagation=${() => emit(new PerformAttack(npc, attack))}>${attack.label}: ${modifier(attack.mod)}
        </button>
    `
}

function modifier(m: number): string {
    if (m < 0) {
        return m.toString()
    }

    return `+${m}`
}
