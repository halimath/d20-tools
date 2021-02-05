
export class Browser {
    static get urlHash(): string {
        if (!document.location.hash) {
            return ""
        }

        return document.location.hash.substr(1)
    }

    static set urlHash(hash: string) {
        let url = document.location.pathname
        if (hash) {
            url += "#" + hash
        }
        window.history.replaceState(null, "", url)
    }
}