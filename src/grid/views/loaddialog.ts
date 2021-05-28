import * as wecco from "@weccoframework/core"
import { modal } from "src/common/components/modal"
import { m } from "../../common/i18n"
import { LoadGrid, Message } from "../controller"
import { GameGridInfo } from "../models"
import { deleteGameGrid, loadSummaries } from "../store"

interface LoadDialogModel {
    onLoad: (id: string) => void
    infos?: Array<GameGridInfo>
}

const LoadDialog = wecco.define("load-dialog", (model: LoadDialogModel, ctx: wecco.RenderContext) => {
    if (!model.infos) {
        ctx.once("load", async () => {
            model.infos = await loadSummaries()
            ctx.requestUpdate()
        })

        return wecco.html`<p class="d-flex justify-content-center">${m("gameGrid.loadGrid.loading")}</p>`
    }

    return wecco.html`
        <div class="modal-header">
            <h5 class="modal-title">${m("gameGrid.loadGrid.title")}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>${m("gameGrid.loadGrid.label")}</th>
                        <th>${m("gameGrid.loadGrid.dimension")}</th>
                        <th>${m("gameGrid.loadGrid.lastModified")}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${model.infos.map((i, idx) => wecco.html`
                        <tr>
                            <td>${i.label}</td>
                            <td>${i.dimension}</td>
                            <td>${m("$relativeTime", i.lastUpdate.getTime() - new Date().getTime())}</td>
                            <td>
                                <button class="btn btn-outline-primary btn-small" data-bs-dismiss="modal" @click=${() => model.onLoad(i.id)}><i class="material-icons">edit</i></button>
                                <button class="btn btn-outline-danger btn-small"><i class="material-icons" @click=${() => {
                                    model.infos?.splice(idx, 1)
                                    deleteGameGrid(i.id)
                                    ctx.requestUpdate()
                                }}>delete</i></button>
                            </td>
                        </tr>`)}
                </tbody>
            </table>
        </div>`
})

export function showLoadDialog(context: wecco.AppContext<Message>): void {
    modal(LoadDialog({
        onLoad(id: string) {
            context.emit(new LoadGrid(id))
        }
    }), {
        show: true,
    })
}