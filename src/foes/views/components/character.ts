import * as wecco from "@wecco/core"
import { Message, PerformAttack, RemoveCharacter, RollSavingThrow, UpdateCurrentHitPoints } from "../../controller"
import { m } from "../../i18n"
import { Attack, Character, Hit, NPC, PC, SavingThrow } from "../../models"

export function character (context: wecco.AppContext<Message>, character: Character, active: boolean): wecco.ElementUpdate {
    if (character instanceof NPC) {
        return npc(context, character, active)
    }

    return pc(context, character, active)
}

function pc(context: wecco.AppContext<Message>, pc: PC, active: boolean): wecco.ElementUpdate {
    return wecco.html`
        <div class="mt-2 mb-2 card character pc shadow-sm ${active ? "" : "ms-4 me-4"}">
            <div class="card-body">
                <div class="row">
                    <div class="col">
                        <strong>${m("foes.ini")}:</strong>${pc.ini.value} (${pc.ini.modifier})
                    </div>
                    <div class="col-6">
                        <h5 class="card-title">${pc.label}</h5>
                    </div>
                    <div class="col text-end">
                        <button class="btn btn-flat float-end" @click=${() => context.emit(new RemoveCharacter(pc))}><i class="material-icons">close</i></button>
                    </div>
                </div>
            </div>
        </div>`
}

function npc (context: wecco.AppContext<Message>, npc: NPC, active: boolean): wecco.ElementUpdate {
    return wecco.html`
        <div class="mt-2 mb-2 card character npc shadow-sm ${active ? "" : "ms-4 me-4"} ${npc.isDead ? "dead": ""}">
            <div class="card-body">                
                <div class="row">
                    <div class="col">
                        <strong>${m("foes.ini")}:</strong>${npc.ini.value} (${npc.ini.modifier})
                    </div>
                    <div class="col-6">
                        <h5 class="card-title">${npc.label}</h5>
                        <h6>${npc.kind.label}</h6>
                        ${npc.kind.tags.map(t => wecco.html`<span class="me-1 badge bg-dark">${t}</span>`)}
                    </div>
                    <div class="col text-end">
                        <button class="btn btn-flat float-end" @click=${() => context.emit(new RemoveCharacter(npc))}><i class="material-icons">close</i></button>
                    </div>
                </div>
                
                <div class="row mt-2">
                    <div class="col">
                        <div class="d-flex align-items-center justify-content-center">
                            <div class="attribute ac">${npc.kind.ac}</div>
                            <div class="attribute hp">${npc.currentHitpoints}</div>
                            <div class="attribute speed">${npc.kind.speed}</div>
                        </div>
                        <div class="mt-2 d-flex align-items-center justify-content-center">
                            ${m("foes.hp")}:
                            <strong class=${npc.currentHitpoints <= 0 ? "text-danger" : ""}>${npc.currentHitpoints}</strong> / ${npc.hitpoints} (${npc.kind.hitDie}) <br>
                            <div class="btn-group ms-1">
                                <button class="btn btn-sm btn-outline-danger" @click=${() => context.emit(new UpdateCurrentHitPoints(npc, -5))}>-5</button>
                                <button class="btn btn-sm btn-outline-danger" @click=${() => context.emit(new UpdateCurrentHitPoints(npc, -1))}>-1</button>
                                <button class="btn btn-sm btn-outline-success" @click=${() => context.emit(new UpdateCurrentHitPoints(npc, 1))}>+1</button>
                                <button class="btn btn-sm btn-outline-success" @click=${() => context.emit(new UpdateCurrentHitPoints(npc, 5))}>+5</button>
                            </div>                                
                        </div>
                    </div>
                    
                    <div class="col d-flex flex-column align-items-center justify-content-center">
                        ${Object.keys(npc.kind.savingThrows).map((savingThrow: SavingThrow) => wecco.html`
                        <div class="mt-1 text-center">
                            <button class="btn btn-outline-secondary" @click=${() => context.emit(new RollSavingThrow(npc, savingThrow))}>${m(`foes.savingthrow.${savingThrow}`)}: ${modifier(npc.kind.savingThrows[savingThrow])}</button>
                            ${npc.savingThrows[savingThrow] ? wecco.html`<span class="badge bg-secondary">${npc.savingThrows[savingThrow]?.value}` : ""}
                        </div>
                        `)}                    
                    </div>

                    <div class="col d-flex align-items-center justify-content-center">
                        ${npc.attacks.map(a => wecco.html`
                        <div>
                            ${attack(context, npc, a[0])}
                            <div class="d-flex justify-content-evenly align-items-center">${hit(a[1])}</div>`)}
                        </div>
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
        <br>
        <span class="badge ac ${acBg}">${m("foes.ac")} ${hit.ac.value}</span>
        ${hit.damage.map(d => wecco.html`<span class="badge hp me-1">${d.label ? `${d.label}: ${d.result.value}` : d.result.value}</span>`)}
    `
}

function attack(context: wecco.AppContext<Message>, npc: NPC, attack: Attack): wecco.ElementUpdate {
    return wecco.html`
        <button class="btn btn-outline-primary" 
            ?disabled=${npc.currentHitpoints <= 0} 
            @click=${() => context.emit(new PerformAttack(npc, attack))}>${attack.label}: ${modifier(attack.mod)}
        </button>
    `
}

function modifier(m: number): string {
    if (m < 0) {
        return m.toString()
    }

    return `+${m}`
}

