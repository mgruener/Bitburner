import {
    hasFormulas
} from "helpers.js";

export const HOME_RESERVED_RAM = 32
export const BASE_SCRIPT_SIZE = 1.6
export const HACK_SCRIPT_SIZE = BASE_SCRIPT_SIZE + 0.1
export const GROW_SCRIPT_SIZE = BASE_SCRIPT_SIZE + 0.15
export const WEAKEN_SCRIPT_SIZE = BASE_SCRIPT_SIZE + 0.15

export class OperationImpact {
    constructor(
        target = isRequired("target"),
        attacker = isRequired("attacker"),
        money = isRequired("hack"),
        security = isRequired("security"),
        threads = isRequired("threads"),
        memory = isRequired("memory")
    ) {
        this._attacker = attacker
        this._target = target
        this._money = money
        this._security = security
        this._threads = threads
        this._memory = memory
    }

    get attacker() {
        return this._attacker
    }

    get target() {
        return this._target
    }

    get money() {
        return this._money
    }

    get security() {
        return this._security
    }

    get threads() {
        return this._threads
    }

    get memory() {
        return this._memory
    }
}

export class Server {
    constructor(ns, hostname = isRequired("hostname")) {
        this._ns = ns
        this._server = ns.getServer(hostname)
    }

    get server() {
        return this._server
    }

    get ramAvail() {
        let reserved = 0
        if (this.server.hostname == "home") {
            reserved = HOME_RESERVED_RAM
        }
        return Math.max(this.server.maxRam - (this.server.ramUsed + reserved), 0)
    }
}

export class Target extends Server {
    // returns true if the server is at its minimum security level and has its maximum amount of money
    isOptimal() {
        return (!this.needsWeakening() && !this.needsGrowing())
    }

    needsGrowing() {
        return this.moneyMissing() > 0
    }

    needsWeakening() {
        return this.securityExcess() > 0
    }

    moneyMissing() {
        return (this._server.moneyMax - this._server.moneyAvailable)
    }

    securityExcess() {
        return (this._server.hackDifficulty - this._server.minDifficulty)
    }

    // op can be weaken, grow or hack
    // With ideal == true, the method returns the operation time with the server at its minimal
    // security level, but only if formulas are available
    _getOpTime(op = isRequired("op"), ideal = false) {
        let o1 = op.toLowerCase()
        let o2 = op.charAt(0).toUpperCase() + op.toLowerCase().slice(1)

        var time = this._ns[`get${o2}Time`](this._server.hostname)
        if (hasFormulas(this._ns) && ideal) {
            let idealServer = { ...this._server, hackDifficulty: this._server.minDifficulty }
            let player = this._ns.getPlayer()
            time = this._ns.formulas.hacking[`${o1}Time`](idealServer, player)
        }
        return time
    }

    weakenTime(ideal = false) {
        return this._getOpTime("weaken", ideal)
    }

    growTime(ideal = false) {
        return this._getOpTime("grow", ideal)
    }

    hackTime(ideal = false) {
        return this._getOpTime("hack", ideal)
    }
}

export class Attacker extends Server {
    weakenImpact(target) {
        let threads = Math.floor(this.ramAvail / WEAKEN_SCRIPT_SIZE)
        let memory = threads * WEAKEN_SCRIPT_SIZE
        let securityImpact = this._ns.weakenAnalyze(threads, this.server.cpuCores)
        return new OperationImpact(target, this, 0, -securityImpact, threads, memory)
    }

    growImpact(target) {
        let threads = Math.floor(this.ramAvail / GROW_SCRIPT_SIZE)
        let memory = threads * GROW_SCRIPT_SIZE
        let securityImpact = this._ns.growthAnalyzeSecurity(threads, target.server.hostname, this.server.cpuCores)

        let amount = NaN
        if (hasFormulas(this._ns)) {
            let growPercent = this._ns.formulas.hacking.growPercent(target.server, growThreads, this._ns.getPlayer(), this.server.cpuCores)
            if (growPercent == Infinity) {
                return target.server.moneyMax
            }
            amount = (target.server.moneyAvailable * growPercent) - target.server.moneyAvailable
        }
        return new OperationImpact(target, this, amount, securityImpact, threads, memory)
    }

    hackImpact(target) {
        let threads = Math.floor(this.ramAvail / HACK_SCRIPT_SIZE)
        let memory = threads * HACK_SCRIPT_SIZE
        let securityImpact = this._ns.hackAnalyzeSecurity(threads, target.server.hostname)
        let amount = this._ns.hackAnalyze(target.server.hostname) * threads * target.server.moneyAvailable

        return new OperationImpact(target, this, -amount, securityImpact, threads, memory)
    }

    reserveMemory() { }
}

export class Attack {
    constructor(ns = isRequired("ns"), target = isRequired("target"), attackers = isRequired("attackers")) {
        this._ns = ns
        this._target = target
        this._attackers = attackers
    }
}

export class Weaken extends Attack { }
export class Grow extends Attack { }
export class Hack extends Attack { }

export class Scheduler {
    constructor(ns = isRequired("ns")) {
        this._ns = ns
    }

    attackTarget(target) {
        let nextAttack = new Hack(this._ns, target)
        if (target.needsWeakening()) {
            nextAttack = new Weaken(this._ns, target)
        } else if (target.needsGrowing()) {
            nextAttack = new Grow(this._ns, target)
        }
        nextAttack.execute()
    }
}