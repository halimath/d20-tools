// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./bootstrap.d.ts" />

import * as wecco from "@weccoframework/core"

export interface ModalHandle {
    show(): void
    hide(): void
}

export interface ModalHandleBinder {
    (handle: ModalHandle): void
}

export interface ModalOptions {
    show: boolean
    size?: "sm" | "lg" | "xl"
    binder: ModalHandleBinder
}

export function modal (content: wecco.ElementUpdate, opts?: Partial<ModalOptions>): wecco.ElementUpdate {
    const options: ModalOptions = {
        show: !!(opts?.show),
        size: opts?.size,
        binder: opts?.binder ?? (() => void 0),
    }

    const onUpdate = (e: Event) => {
        const modalElement = e.target as HTMLElement
        const modal = new bootstrap.Modal(modalElement)
        if (options.show) {
            modal.show()
        }
        options.binder(modal)
    }

    return wecco.html`
        <div class="modal fade" tabindex="-1" aria-hidden="true" @update=${onUpdate}>
            <div class="modal-dialog ${options.size ? "modal-" + options.size : ""}">
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        </div>    
    `
}