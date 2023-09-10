export class SleeveArmy {
    #ns
    #numSleeves
    #claims

    /** @param {import("../..").NS } ns */
    constructor(ns) {
        this.#ns = ns
        this.#numSleeves = ns.sleeve.getNumSleeves()
        if (!self.sleeveClaims) {
            self.sleeveClaims = new SleeveClaims(ns)
        }
        this.#claims = self.sleeveClaims
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

    ownedClaims(owner) {
        return this.#claims.ownedClaims(owner)
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

    availableSleeve() {
        if (this.#claims.unclaimed.length > 0) {
            const unclaimed = this.#claims.unclaimed
            //this.#ns.tprintf("unclaimed: %s", unclaimed)
            return unclaimed[0]
        }
        return "-1"
    }

    setToCommitCrime(crimeType, owner) {
        const task = {
            "type": "CRIME",
            "crimeType": crimeType
        }
        const id = this.availableSleeve()
        const claim = this.#claims.claim(id, task, owner)
        if (claim != null) {
            if (!this.api.setToCommitCrime(id, crimeType)) {
                this.#claims.release(claim)
                return null
            }
        }
        return claim
    }

    setToCompanyWork(companyName, owner) {
        const task = {
            "type": "COMPANY",
            "companyName": companyName
        }
        const id = this.availableSleeve()
        const claim = this.#claims.claim(id, task, owner)
        if (claim != null) {
            if (!this.api.setToCompanyWork(id, companyName)) {
                this.#claims.release(claim)
                return null
            }
        }
        return claim
    }

    setToFactionWork(factionName, factionWorkType, owner) {
        const task = {
            "type": "FACTION",
            "factionWorkType": factionWorkType,
            "factionName": factionName
        }
        const id = this.availableSleeve()
        const claim = this.#claims.claim(id, task, owner)
        if (claim != null) {
            if (!this.api.setToFactionWork(id, factionName, factionWorkType)) {
                this.#claims.release(claim)
                return null
            }
        }
        return claim
    }

    setToGymWorkout(gymName, stat, owner) {
        const task = {
            "type": "CLASS",
            "classType": stat,
            "location": gymName
        }
        const id = this.availableSleeve()
        const claim = this.#claims.claim(id, task, owner)
        if (claim != null) {
            if (!this.api.setToGymWorkout(id, gymName, stat)) {
                this.#claims.release(claim)
                return null
            }
        }
        return claim
    }

    setToIdle(owner) {
        const task = null
        const id = this.availableSleeve()
        const claim = this.#claims.claim(id, task, owner)
        if (claim != null) {
            this.api.setToIdle(id)
        }
        return claim
    }

    setToShockRecovery(owner) {
        const task = {
            "type": "RECOVERY"
        }
        const id = this.availableSleeve()
        const claim = this.#claims.claim(id, task, owner)
        if (claim != null) {
            if (!this.api.setToShockRecovery(id)) {
                this.#claims.release(claim)
                return null
            }
        }
        return claim
    }

    setToSynchronize(owner) {
        const task = {
            "type": "SYNCHRO"
        }
        const id = this.availableSleeve()
        const claim = this.#claims.claim(id, task, owner)
        if (claim != null) {
            if (!this.api.setToSynchronize(id)) {
                this.#claims.release(claim)
                return null
            }
        }
        return claim
    }

    setToUniversityCourse(university, className, owner) {
        const task = {
            "type": "CLASS",
            "classType": className,
            "location": university
        }
        const id = this.availableSleeve()
        const claim = this.#claims.claim(id, task, owner)
        if (claim != null) {
            if (!this.api.setToUniversityCourse(id, university, className)) {
                this.#claims.release(claim)
                return null
            }
        }
        return claim
    }
}

export class SleeveClaim {
    #id
    #task
    #owner
    constructor(id, task, owner) {
        this.#id = id
        this.#task = task
        this.#owner = owner
    }

    get id() {
        return this.#id
    }
    get task() {
        return this.#task
    }
    get owner() {
        return this.#owner
    }

    release() {
        if (self.sleeveClaims) {
            self.sleeveClaims.release(this)
        }
    }
}

export class SleeveClaims {
    #claims
    constructor() {
        this.#claims = {}
    }

    static get validIDs() { return ["0", "1", "2", "3", "4", "5", "6", "7"] }

    // returns a list of unclaimed sleeve ids
    get unclaimed() {
        let claimed = Object.keys(this.#claims)
        if (!claimed) {
            claimed = []
        }
        return SleeveClaims.validIDs.filter((id) => !claimed.includes(id))
    }

    ownedClaims(owner) {
        const result = []
        Object.values(this.#claims).forEach(claim => {
            if (claim.owner == owner) {
                result.push(claim)
            }
        })
        return result
    }

    claim(id, task, owner) {
        if (!SleeveClaims.validIDs.includes(id)) {
            return null
        }
        if (!(id in this.#claims)) {
            const claim = new SleeveClaim(id, task, owner)
            this.#claims[id] = claim
            return claim
        }
        return null
    }

    release(claim) {
        // if there is no current claim for the given
        // sleeve id, there is nothing to release so
        // technically we consider the claim successfull
        if (!(claim.id in this.#claims)) {
            return true
        }

        const contestedClaim = this.#claims[claim.id]
        // check if the claims have different owners
        // if so, fail as only the original owner of a claim
        // can release it
        if (contestedClaim.owner != claim.owner) {
            return false
        }

        // if the task object of the provided and the
        // contested claim are exactly the same (which could
        // be the case for a claim on an idle task as the
        // idle task is null), then the claim release
        // has been validated and we can release the claim
        if (contestedClaim.task == claim.task) {
            delete this.#claims[contestedClaim.id]
            return true
        }
        // check if all fields of the contested claim
        // match the same fields in the provided claim
        // if not, we are dealing with different claims
        // and we cannot release the contested claim
        Object.keys(contestedClaim).forEach(key => {
            if (contestedClaim[key] != claim[key]) {
                return false
            }
        })

        // the provided claim matches the contested claim
        // so we can relaese the contested claim
        delete this.#claims[contestedClaim.id]
        return true
    }

    break(id) {
        if (id in this.#claims) {
            delete this.#claims[contestedClaim.id]
        }
    }

    breakAll() {
        SleeveClaims.validIDs.forEach(id => {
            this.break(id)
        })
    }
}