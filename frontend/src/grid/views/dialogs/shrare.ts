import * as wecco from "@weccoframework/core"
import { modal } from "src/common/components/modal"
import { m } from "../../../common/i18n"
import { GameGrid } from "../../models/models"

const ShareDialog = wecco.define("share-dialog", ({data}: wecco.RenderContext<{ grid: GameGrid }>) => {
    const url = document.location.href.replace(/edit:.*$/, `view:${data.grid.id}`)
    return wecco.html`
        <div class="modal-header">
            <h5 class="modal-title">${m("gameGrid.share.title")}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <div class="input-group">
                <input type="text" class="form-control" value=${url}>
                <button class="btn btn-primary" @click=${() => navigator.clipboard.writeText(url)}><i class="material-icons">content_copy</i></button>
            </div>
        </div>`
})

export function showShareDialog(grid: GameGrid): void {
    modal(ShareDialog({grid: grid}), {
        show: true,
    })
}