import * as wecco from "@wecco/core"
import { Message } from "../../controller"
import { m } from "../../i18n"
import { Attack, Kind } from "../../models"

export function kind(kind: Kind, context: wecco.AppContext<Message>): wecco.ElementUpdate {
    return wecco.html`        
            <div class="card kind shadow mt-2">
                <div class="card-body">
                    <div class="float-end">
                        <button class="btn btn-link text-danger" @click=${() => console.log("todo")}><i class="material-icons">delete</i></button>
                    </div>
                    <h5 class="card-title">${kind.label}</h5>
                    <div class="card-text">
                        ${kind.tags.map(t => wecco.html`<span class="me-1 badge bg-dark">${t}</span>`)}
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Speed</th>
                                <th>Ini</th>
                                <th>AC</th>
                                <th>HP</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${kind.speed}</td>
                                <td>${modifier(kind.ini)}</td>
                                <td>${kind.ac}</td>
                                <td>${kind.hitDie}</td>
                            </tr>
                        </tbody>
                    </table>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>${m("foes.kindEditor.attack")}</th>
                                <th>${m("foes.kindEditor.modifier")}</th>
                                <th>${m("foes.kindEditor.damage")}</th>
                            </tr>
                            <tbody>
                                ${kind.attacks.map(attackView)}
                            </tbody>
                        </thead>
                    </table>
                </div>
            </div>
    `
}

function attackView(attack: Attack): wecco.ElementUpdate {
    return wecco.html`
        <tr>
            <td>${attack.label}</td>
            <td>${modifier(attack.mod)}</td>
            <td>${attack.damage.map(d => d.label ? `${d.label}: ${d.damage}` : d.damage).join(", ")}</td>
        </tr>
    `
}

function modifier(m: number): string {
    if (m < 0) {
        return m.toString()
    }

    return `+${m}`
}