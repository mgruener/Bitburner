export class Network {
    #ns
    #knownHosts

    /** @param {import("../..").NS } ns */
    constructor(ns) {
        ns.disableLog("disableLog")
        ns.disableLog("scan")
        this.#ns = ns
        this.#knownHosts = {}
        const knownHosts = {}

        this.walk(function (network, node, children) {
            knownHosts[node] = { ...network.ns.getServer(node), "children": children }
        })
        this.#knownHosts = knownHosts
    }

    get ns() {
        return this.#ns
    }

    get knownHosts() {
        return this.#knownHosts
    }

    /** @param {string} hostname */
    goToServer(hostname) {
        const path = this.findServer([hostname])
        path[0].forEach(element => {
            this.ns.singularity.connect(element)
        });
    }

    /** @param {Array} hostnames */
    findServer(hostnames) {
        const result = []
        for (const hostname of hostnames) {
            const queryResult = []
            const handlers = new WalkHandlers()
            handlers.postFn = function (network, node, children) {
                if (node == hostname) {
                    queryResult.push(node)
                    return
                }
                if (children.includes(queryResult[0])) {
                    queryResult.unshift(node)
                }
            }
            this.walkWithHandlers(handlers)
            result.push(queryResult)
        }
        return result
    }

    /**
     * @param {function} preFn
     * @param {function} postFn
     * @param {function} preChildFn
     * @param {function} postChildFn
     */
    walk(preFn, postFn, preChildFn, postChildFn) {
        this.walkWithHandlers(new WalkHandlers(preFn, postFn, preChildFn, postChildFn))
    }

    /** @param {WalkHandlers} handlers */
    walkWithHandlers(handlers) {
        const entryPoint = "home"
        const visited = new Set()
        this.#dfs(visited, entryPoint, handlers)
    }

    /** @param {string} node */
    scan(node) {
        if (node in this.#knownHosts) {
            return this.#knownHosts[node]["children"]
        }
        return this.#ns.scan(node).filter((h) => h != node)
    }

    /**
     * @param {Array} visited
     * @param {string} node
     * @param {WalkHandlers} handlers
     */
    #dfs(visited, node, handlers) {
        if (!visited.has(node)) {
            visited.add(node)
            const scanResult = this.scan(node)
            handlers.preFn(this, node, scanResult)
            for (const next of scanResult) {
                handlers.preChildFn(this, node, next, scanResult)
                this.#dfs(visited, next, handlers)
                handlers.postChildFn(this, node, next, scanResult)
            }
            handlers.postFn(this, node, scanResult)
        }
    }

}


export class WalkHandlers {
    #preFn
    #postFn
    #preChildFn
    #postChildFn

    /**
     * @param {function} preFn
     * @param {function} postFn
     * @param {function} preChildFn
     * @param {function} postChildFn
     */
    constructor(preFn, postFn, preChildFn, postChildFn) {
        this.#preFn = preFn ? preFn : function () { }
        this.#postFn = postFn ? postFn : function () { }
        this.#preChildFn = preChildFn ? preChildFn : function () { }
        this.#postChildFn = postChildFn ? postChildFn : function () { }
    }

    /** @param {function} fn */
    set preFn(fn) {
        this.#preFn = fn
    }

    /** @param {function} fn */
    set postFn(fn) {
        this.#postFn = fn
    }

    /** @param {function} fn */
    set preChildFn(fn) {
        this.#preChildFn = fn
    }

    /** @param {function} fn */
    set postChildFn(fn) {
        this.#postChildFn = fn
    }

    get preFn() {
        return this.#preFn
    }

    get postFn() {
        return this.#postFn
    }

    get preChildFn() {
        return this.#preChildFn
    }

    get postChildFn() {
        return this.#postChildFn
    }
}