import * as wecco from "@wecco/core"
import { ModalHandle } from "src/common/components/modal"
import { Message, SaveKind } from "../../controller"
import { m } from "../../i18n"
import { Kind } from "../../models"
import { editKindModal } from "./editKind"

export function kinds(kinds: Array<Kind>, context: wecco.AppContext<Message>): wecco.ElementUpdate {
    return wecco.html`
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>${m("foes.label")}</th>
                    <th>${m("foes.ini")}</th>
                    <th>${m("foes.speed")}</th>
                    <th>${m("foes.ac")}</th>
                    <th>${m("foes.hp")}</th>
                    <th>${m("foes.savingthrow.reflex")}</th>
                    <th>${m("foes.savingthrow.will")}</th>
                    <th>${m("foes.savingthrow.fortitude")}</th>
                    <th>${m("foes.attacks")}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${kinds.map(kindRow.bind(null, context))}
            </tbody>
        </table>
    `
}

function kindRow(context: wecco.AppContext<Message>, k: Kind, idx: number): wecco.ElementUpdate {
    let modalHandle: ModalHandle
    return wecco.html`
        <tr>
            <td>
                <h5>${k.label}</h5>
                ${k.tags.map(t => wecco.html`<span class="me-1 badge bg-dark">${t}</span>`)}                            
            </td>
            <td>${modifier(k.ini)}</td>
            <td>${k.speed}</td>
            <td>${k.ac}</td>
            <td>${k.hitDie}</td>
            <td>${modifier(k.savingThrows.reflex)}</td>
            <td>${modifier(k.savingThrows.will)}</td>
            <td>${modifier(k.savingThrows.fortitude)}</td>
            <td>
                <ul>                        
                    ${k.attacks.map(a => wecco.html`
                    <li>
                        ${a.label}: ${modifier(a.mod)}
                        <ul>
                            ${a.damage.map(d => wecco.html`
                                <li>${d.label}: ${d.damage}</li>
                            `)}
                        </ul>
                    </li>`)}
                </ul>
            </td>
            <td>
                ${editKindModal(k => context.emit(new SaveKind(k, idx)), mh => modalHandle = mh, k)}
                <button class="btn btn-link"><i class="material-icons" @click=${() => modalHandle.show()}>edit</i></button>                
                <button class="btn btn-link text-danger"><i class="material-icons">delete</i></button>                
            </td>
        </tr>
    `
}

function modifier(m: number): string {
    if (m < 0) {
        return m.toString()
    }

    return `+${m}`
}