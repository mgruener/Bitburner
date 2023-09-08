export class SleeveArmy {
    #ns
    #numSleeves

    /** @param {import("../..").NS } ns */
    constructor(ns) {
        this.#ns = ns
        this.#numSleeves = ns.sleeve.getNumSleeves()
    }

    get ns() {
        return this.#ns
    }

    get api() {
        return this.#ns.sleeve
    }

    augmentAll() {
        const augs = this.purchasableAugs()
        // list of available augments we consider for
        // purchase, sorted from cheapest to most expensive
        const validAugs = Object.keys(augs).sort((a, b) => {
            return augs[a] - augs[b]
        })
        var done = false
        // 0 means no cost cap
        var costCap = 0
        while (!done && validAugs.length > 0) {
            const cost = this.augCost(costCap)
            if (this.ns.getPlayer().money < cost) {
                // remove the currently most expensive aug from the list of valid augs,
                // and set its price as the new cost cap (minus one because augCosts considers
                // an exact match still a valid price)
                const excluded = validAugs.pop()
                costCap = augs[excluded] - 1
                continue
            }
            this.forAllSleeves(function (army, id) {
                army.api.getSleevePurchasableAugs(id).forEach(aug => {
                    if (validAugs.includes(aug.name)) {
                        army.api.purchaseSleeveAug(id, aug.name)
                    }
                })
            })
            done = true
        }
    }

    purchasableAugs() {
        const result = {}
        this.forAllSleeves(function (army, id) {
            army.api.getSleevePurchasableAugs(id).forEach(aug => {
                // as all augs with the same name cost the same, we do not
                // care if we "overwrite" an already known aug
                result[aug.name] = aug.cost
            })
        })
        return result
    }

    /** @param {int} max */
    augCost(max = 0) {
        var cost = 0
        this.forAllSleeves(function (army, id) {
            const augs = army.api.getSleevePurchasableAugs(id)
            augs.forEach(aug => {
                if ((max <= 0) || (aug.cost <= max)) {
                    cost += aug.cost
                }
            })
        })
        return cost
    }

    /** @param {function} fn */
    forAllSleeves(fn) {
        for (var id = 0; id < this.#numSleeves; id++) {
            fn(this, id)
        }
    }
}