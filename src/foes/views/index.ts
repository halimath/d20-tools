import * as wecco from "@wecco/core"
import { appShell } from "src/common/components/appShell"
import { m } from "src/common/i18n"
import { CreateCharacter, Message, PerformAttack, RemoveCharacter, RollSavingThrow, SelectTab, UpdateCurrentHitPoints} from "../controller"
import { Attack, Model, Character, Hit, Kind, SavingThrow } from "../models"
import { kindEditor } from "./components/kindeditor"

export function root(model: Model, context: wecco.AppContext<Message>): wecco.ElementUpdate {
    let content: wecco.ElementUpdate = ""
    
    if (model.tab === "characters") {
        content = wecco.html`
            ${model.characters.map(c => wecco.html`<div class="col-sm-12 col-md-6 col-lg-4 mt-2">${character(context, c)}</div>`)}

            <div class="col-sm-12 col-md-6 col-lg-4 mt-2 character add d-flex align-items-center justify-content-center position-relative">
                <button class="btn btn-large btn-flat stretched-link" @click=${() => new bootstrap.Modal(document.querySelector("#create-character-dialog")).show()}><i class="material-icons">add</i></button>
            </div>
        `
    } else {
        content = wecco.html`            
            ${model.kinds.map(k => wecco.html`<div class="col-sm-12 col-md-6 col-lg-4">
                ${kindEditor({
                    kind: k,
                    inEdit: false,
                    onChange: k => console.log(k),
                    onDelete: () => console.log("delete", k),
                })}
                </div>`
            )}
                
            <div class="col-sm-12 col-md-6 col-lg-4 card character h-100 add d-flex align-items-center justify-content-center">
                <a class="btn btn-large btn-flat stretched-link" @click=${() => console.log("add")}><i class="material-icons">add</i></a>
            </div>
        `
    }

    const body = wecco.html`        
        <div class="container">
            <div class="row mt-2">
                <nav class="nav">
                    <a class="nav-link ${model.tab === "characters" ? "active" : ""}" @click=${() => context.emit(new SelectTab("characters"))}>${m("foes.characters")}</a>
                    <a class="nav-link ${model.tab === "kinds" ? "active" : ""}" @click=${() => context.emit(new SelectTab("kinds"))}>${m("foes.kinds")}</a>
                </nav>
            </div>
            <div class="row mt-2">
                ${content}
            </div>
        </div>
        ${createCharacterDialog(context, model.kinds)}
    `

    return appShell(body)
}

function createCharacterDialog(context: wecco.AppContext<Message>, kinds: Array<Kind>): wecco.ElementUpdate {
    let dialog: HTMLElement

    const onCreate = () => {        
        const label = (dialog.querySelector("input[type='text']") as HTMLInputElement).value
        const kind = kinds[parseInt((dialog.querySelector("select") as HTMLSelectElement).value)]
        bootstrap.Modal.getInstance(dialog).hide()
        context.emit(new CreateCharacter(label, kind))
    }

    return wecco.html`    
        <div class="modal" id="create-character-dialog" tabindex="-1" @update=${(e: Event) => {dialog = e.target as HTMLElement}}>
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${m("foes.createCharacter")}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-2">
                            <label for="create-character-label">${m("foes.createCharacter.label")}</label>
                            <input type="text" id="create-character-label" placeholder=${m("foes.createCharacter.label")} class="form-control">
                        </div>
                        <div class="mb-2">
                            <label for="create-character-kind">${m("foes.createCharacter.kind")}</label>
                            <select class="form-select" id="create-character-kind">
                                ${kinds.map((k, idx) => wecco.html`<option value=${idx}>${k.label}</option>`)}
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${m("close")}</button>
                        <button type="button" class="btn btn-primary" @click=${onCreate}>${m("foes.createCharacter")}</button>
                    </div>
                </div>
            </div>
        </div>    
    `    
}

function character (context: wecco.AppContext<Message>, character: Character): wecco.ElementUpdate {
    return wecco.html`
        <div class="card character shadow ${character.isDead ? "dead": ""}">
            <div class="card-body">
                <button class="btn btn-flat float-end" @click=${() => context.emit(new RemoveCharacter(character))}><i class="material-icons">close</i></button>
                
                <h5 class="card-title">${character.label} <small>[${character.ini.value}; ${character.ini.modifier}]</small></h5>
                <h6>${character.kind.label}</h6>
                
                <div class="card-text">
                    ${character.kind.tags.map(t => `<span class="me-1 badge bg-secondary">${t}</span>`)}
                </div>
                
                <div class="mt-2 d-flex align-items-center justify-content-center">
                    <div class="attribute ac">${character.kind.ac}</div>
                    <div class="attribute hp">${character.currentHitpoints}</div>
                    <div class="attribute speed">${character.kind.speed}</div>
                </div>                

                <div class="mt-2 d-flex align-items-center justify-content-center">
                    ${m("foes.hp")}:
                    <strong class=${character.currentHitpoints <= 0 ? "text-danger" : ""}>${character.currentHitpoints}</strong> / ${character.hitpoints} (${character.kind.hitDie}) <br>
                    <div class="btn-group ms-1">
                        <button class="btn btn-sm btn-outline-danger" @click=${() => context.emit(new UpdateCurrentHitPoints(character, -5))}>-5</button>
                        <button class="btn btn-sm btn-outline-danger" @click=${() => context.emit(new UpdateCurrentHitPoints(character, -1))}>-1</button>
                        <button class="btn btn-sm btn-outline-success" @click=${() => context.emit(new UpdateCurrentHitPoints(character, 1))}>+1</button>
                        <button class="btn btn-sm btn-outline-success" @click=${() => context.emit(new UpdateCurrentHitPoints(character, 5))}>+5</button>
                    </div>                                
                </div>

                <div class="mt-2 d-flex align-items-center justify-content-center">
                    ${Object.keys(character.kind.savingThrows).map((savingThrow: SavingThrow) => wecco.html`
                    <div class="col text-center">
                        <button class="btn btn-light" @click=${() => context.emit(new RollSavingThrow(character, savingThrow))}>${m(`foes.savingthrow.${savingThrow}`)}: ${modifier(character.kind.savingThrows[savingThrow])}</button>
                        ${character.savingThrows[savingThrow] ? wecco.html`<span class="badge bg-secondary">${character.savingThrows[savingThrow]?.value}` : ""}
                    </div>
                    `)}
                </div>
                
                <div class="row mt-2">
                    ${character.attacks.map(a => wecco.html`
                    <div class="col">
                        ${attack(context, character, a[0])}
                        ${hit(a[1])}
                    </div>`)}
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

function attack(context: wecco.AppContext<Message>, character: Character, attack: Attack): wecco.ElementUpdate {
    return wecco.html`
        <button class="btn btn-outline-secondary" 
            ?disabled=${character.currentHitpoints <= 0} 
            @click=${() => context.emit(new PerformAttack(character, attack))}>${attack.label}: ${modifier(attack.mod)}
        </button>
    `
}

function modifier(m: number): string {
    if (m < 0) {
        return m.toString()
    }

    return `+${m}`
}

