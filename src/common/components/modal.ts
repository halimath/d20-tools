// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./bootstrap.d.ts" />

import * as wecco from "@wecco/core"

export interface ModalHandle {
    show(): void
    hide(): void
}

export interface ModalOptions {
    title: string
    actions: Array<wecco.ElementUpdate>
    show: boolean
    onCreate(modal: ModalHandle): void
}

export function modal (content: wecco.ElementUpdate, opts?: Partial<ModalOptions>): wecco.ElementUpdate {
    const options: ModalOptions = {
        title: opts?.title ?? "",
        actions: opts?.actions ?? [],
        show: !!(opts?.show),
        onCreate: opts?.onCreate ?? (() => void 0),
    }

    const onUpdate = (e: Event) => {
        const modalElement = e.target as HTMLElement
        const modal = new bootstrap.Modal(modalElement)
        if (options.show) {
            modal.show()
        }
        options.onCreate(modal)
    }

    return wecco.html`
        <div class="modal fade" tabindex="-1" aria-hidden="true" @update=${onUpdate}>
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">${options.title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">${content}</div>
                    <div class="modal-footer">
                        ${options.actions}
                    </div>
                </div>
            </div>
        </div>    
    `
}