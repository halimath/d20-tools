import * as wecco from "@wecco/core"
import { m } from "src/common/i18n"
import { Attack, Kind } from "src/foes/models"

export interface Model {
    kind: Kind,
    inEdit?: boolean
    onChange: (kind: Kind) => void
    onDelete: () => void
}

export const kindEditor = wecco.define("d20-kindeditor", (model: Model, context: wecco.RenderContext): wecco.ElementUpdate => {
    if (!model.inEdit) {
        return view(model, context)
    }
    return edit(model, context)
})

function view(model: Model, context: wecco.RenderContext): wecco.ElementUpdate {
    return wecco.html`        
            <div class="card kind shadow">
                <div class="card-body">
                    <div class="float-end">
                        <button class="btn btn-flat" @click=${() => { model.inEdit = true; context.requestUpdate()}}><i class="material-icons">edit</i></button>
                        <button class="btn btn-flat text-danger" @click=${model.onChange}><i class="material-icons">delete</i></button>
                    </div>
                    <h5 class="card-title">${model.kind.label}</h5>
                    <div class="card-text">
                        ${model.kind.tags.map(t => wecco.html`<span class="me-1 badge bg-dark">${t}</span>`)}
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
                                <td>${model.kind.speed}</td>
                                <td>${modifier(model.kind.ini)}</td>
                                <td>${model.kind.ac}</td>
                                <td>${model.kind.hitDie}</td>
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
                                ${model.kind.attacks.map(attackView)}
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

function edit(model: Model, context: wecco.RenderContext): wecco.ElementUpdate {
    const onAbort = () => {
        model.inEdit = false
        context.requestUpdate()
    }

    const onSave = () => {
        // TODO: Implement
        model.onChange(model.kind)
    }    

    return wecco.html`        
            <div class="card kind shadow">
                <div class="card-body">
                    <div class="float-end">
                        <button class="btn btn-flat" @click=${onSave}><i class="material-icons">save</i></button>
                        <button class="btn btn-flat" @click=${onAbort}><i class="material-icons">close</i></button>
                    </div>

                    <input type="text" placeholder="Goblin Marauder" value=${model.kind.label} class="form-control mt-1">
                    
                    <div class="card-text">
                        <input type="text" value=${model.kind.tags.join(", ")}  class="form-control mt-1">
                    </div>
                    
                    <div class="card-text">
                        <dl class="row">
                            <dt class="col-6">Speed:</dt>
                            <dd class="col-6"><input type="number" value=${model.kind.speed} class="form-control"></dd>

                            <dt class="col-6">AC:</dt>
                            <dd class="col-6"><input type="number" value=${model.kind.ac} class="form-control"></dd>

                            <dt class="col-6">HP</dt>
                            <dd class="col-6"><input type="text" value=${model.kind.hitDie} class="form-control"></dd>
                        </dl>
                    </div>

                    <table class="table">
                        <thead>
                            <tr>
                                <th>${m("foes.kindEditor.attack")}</th>
                                <th>${m("foes.kindEditor.modifier")}</th>
                                <th>${m("foes.kindEditor.damage")}</th>
                            </tr>
                            <tbody>
                                ${model.kind.attacks.map(attackEdit)}
                            </tbody>
                        </thead>
                    </table>
                </div>
            </div>
    `
}

function attackEdit(attack: Attack): wecco.ElementUpdate {
    return wecco.html`
        <tr>
            <td>${attack.label}</td>
            <td>${attack.mod}</td>
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