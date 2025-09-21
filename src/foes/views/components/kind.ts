import * as wecco from "@weccoframework/core"
import { ModalHandle } from "../../../common/components/modal-deprecated"
import { Message, SaveKind } from "../../controller"
import { m } from "../../../common/i18n"
import { Kind } from "../../models"
import { editKindModal } from "./editKind"

export function kinds(kinds: Array<Kind>, emit: wecco.MessageEmitter<Message>): wecco.ElementUpdate {
    return wecco.html`
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>${m("foes.label")}</th>
                    <th>${m("foes.ini")}</th>
                    <th>${m("foes.speed")}</th>
                    <th>${m("foes.ac")}</th>
                    <th>${m("foes.hp")}</th>
                    <th>${m("foes.savingthrow.str")}</th>
                    <th>${m("foes.savingthrow.dex")}</th>
                    <th>${m("foes.savingthrow.con")}</th>
                    <th>${m("foes.savingthrow.int")}</th>
                    <th>${m("foes.savingthrow.wis")}</th>
                    <th>${m("foes.savingthrow.cha")}</th>
                    <th>${m("foes.attacks")}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                ${kinds.map(kindRow.bind(null, emit))}
            </tbody>
        </table>
    `
}

function kindRow(emit: wecco.MessageEmitter<Message>, k: Kind, idx: number): wecco.ElementUpdate {
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
            <td>${modifier(k.savingThrows.str)}</td>
            <td>${modifier(k.savingThrows.dex)}</td>
            <td>${modifier(k.savingThrows.con)}</td>
            <td>${modifier(k.savingThrows.int)}</td>
            <td>${modifier(k.savingThrows.wis)}</td>
            <td>${modifier(k.savingThrows.cha)}</td>
            <td>
                <ul class="list-unstyled">                        
                    ${k.attacks.map(a => wecco.html`
                    <li>
                        ${a.label}: ${modifier(a.mod)}
                    </li>`)}
                </ul>
            </td>
            <td>
                ${editKindModal(k => emit(new SaveKind(k, idx)), mh => modalHandle = mh, k)}
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