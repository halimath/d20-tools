import * as wecco from "@weccoframework/core"
import * as bootstrap from "bootstrap"

export interface ModalHandle {
    show(): void
    hide(): void
}

export interface ModalOptions {
    show: boolean
    size?: "sm" | "lg" | "xl"
}

export function modal (content: wecco.ElementUpdate, opts?: Partial<ModalOptions>): ModalHandle {
    const options: ModalOptions = {
        show: !!(opts?.show),
        size: opts?.size,
    }

    let modal: bootstrap.Modal

    const onUpdate = (e: Event) => {
        const modalElement = e.target as HTMLElement
        modal = new bootstrap.Modal(modalElement)
        if (options.show) {
            modal.show()
        }
    }

    let outlet = document.querySelector("#modal-outlet")
    if (!outlet) {
        outlet = document.body.appendChild(document.createElement("div"))
        outlet.id = "modal-outlet"
    }

    wecco.updateElement(outlet, wecco.html`
        <div class="modal fade" tabindex="-1" aria-hidden="true" @updateend=${onUpdate}>
            <div class="modal-dialog ${options.size ? "modal-" + options.size : ""}">
                <div class="modal-content">
                    ${content}
                </div>
            </div>
        </div>    
    `)

    return {
        show: () => {
            modal?.show()
        },

        hide: () => {
            modal?.hide()
        }
    }
}