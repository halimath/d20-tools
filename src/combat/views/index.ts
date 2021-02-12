import * as wecco from "@wecco/core"
import { appShell } from "src/common/components/appShell"
import { range } from "src/common/tools"
import { Message, NextParticipant } from "../controller"
import { Character, Model, NPC, PC } from "../models"

export function root(model: Model, context: wecco.AppContext<Message>): wecco.ElementUpdate {
    const body = wecco.html`
        <div class="container">
            <div class="row mt-2">
                <div class="col">
                    <table class="table table-responsive">
                        <thead>
                            <tr>
                                <th>Ini</th>
                                <th>Participant</th>
                                ${[...range(model.numberOfRounds)].map(r => wecco.html`<th>R #${r + 1}</th>`)}
                            </tr>
                        </thead>
                        <tbody>
                            ${model.participants.map((p, idx) => wecco.html`
                                <tr class=${idx === model.activeParticipant ? "table-active" : ""}>
                                    <td>
                                        ${p.initiative}
                                        <button class="btn btn-outline-secondary show-on-hover"><i class="material-icons">edit</i></button>
                                    </td>
                                    <td>${characterCell(p.character, idx === model.activeParticipant, context)}</td>
                                    ${model.roundsForParticipant(idx).map(() => wecco.html`<td></td>`)}
                                </tr>
                            `)}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="row">
                <div class="col">
                    <div class="btn-group">
                        
                    </div>
                </div>
            </div>
        </div>
    `
    return appShell(body)
}

function characterCell (c: Character, active: boolean, context: wecco.AppContext<Message>): wecco.ElementUpdate {
    const parts: Array<wecco.ElementUpdate> = []

    if (c instanceof PC) {
        parts.push(wecco.html`<span class="badge rounded-pill bg-secondary">PC</span> ${c.label}`)
    
    } else if (c instanceof NPC) {
        parts.push(`<span class="me-2 badge rounded-pill bg-secondary">NPC</span>`)
        parts.push(c.label)
    
        if (c.attributes.speed) {
            parts.push(wecco.html`<span class="ms-2 badge bg-secondary">Spd: ${c.attributes.speed}</span>`)
        }

        if (c.attributes.armorClass) {
            parts.push(wecco.html`<span class="ms-2 badge bg-dark">AC ${c.attributes.armorClass}</span>`)
        }

        c.attributes.attacks.forEach(a => {
            parts.push(wecco.html`<button class="ms-2 btn btn-small btn-outline-danger" ?disabled=${!active}>${a.label}</button>`)
        })
    
    } else {
        parts.push(c.label)
    }

    if (active) {
        parts.push(wecco.html`<button class="ms-2 btn btn-outline-primary" @click=${() => context.emit(new NextParticipant())}><i class="material-icons">fast_forward</i></button>`)
    }

    return parts    
}