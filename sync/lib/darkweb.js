export class Darkweb {
    #ns

    /** @param {import("../..").NS } ns */
    constructor(ns) {
        this.#ns = ns
        this.#buyTor()
    }

    #buyTor() {
        if (!ns.hasTorRouter()) {
            return ns.singularity.purchaseTor()
        }
        return true
    }

    buyAll() {
        this.buy(this.#ns.singularity.getDarkwebPrograms())
    }

    buyPortOpener() {
        this.buy(["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"])
    }

    buy(filter = []) {
        if (!this.#buyTor()) {
            return
        }
        // get darkweb programs, ordered by price
        const programs = this.#ns.singularity.getDarkwebPrograms().sort((a, b) => {
            return this.#ns.singularity.getDarkwebProgramCost(a) - this.#ns.singularity.getDarkwebProgramCost(b)
        }).filter((p) => filter.includes(p))

        // try to buy programs, cheapest to most expensive
        programs.forEach(program => {
            if (!ns.fileExists(program, "home")) {
                this.#ns.singularity.purchaseProgram(program)
            }
        })
    }
}