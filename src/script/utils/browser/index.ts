
export class Browser {
    static get urlHash(): string | null {
        if (!document.location.hash) {
            return null
        }

        return document.location.hash.substr(1)
    }

    static set urlHash(hash: string | null) {
        let url = document.location.pathname
        if (hash) {
            url += "#" + hash
        }
        window.history.replaceState(null, "", url)
    }
}