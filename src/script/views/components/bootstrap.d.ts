declare namespace bootstrap {
    interface ModalOptions {
        backdrop?: boolean | "static"
        keyboard?: boolean
        focus?: boolean
    }

    class Modal {
        constructor(el: Element | null, opts?: ModalOptions)
        toggle(): void
        show(): void
        hide(): void
    }
}
