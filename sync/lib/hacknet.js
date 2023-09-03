import {
    canAfford,
    deployPayload
} from "lib/utils.js";
// Upgrades:
//   Sell for Money
//   Sell for Corporation Funds
//   Reduce Minimum Security
//   Increase Maximum Money
//   Improve Studying
//   Improve Gym Training
//   Exchange for Corporation Research
//   Exchange for Bladeburner Rank
//   Exchange for Bladeburner SP
//   Generate Coding Contract
export class HacknetServerManager {
    #ns
    #nodeLimit
    #completed = new Set()
    #upgrades
    constructor(ns = isRequired("ns")) {
        this.#ns = ns
        this.#nodeLimit = this.api.maxNumNodes()
        this.#upgrades = getUpgrades(this.#ns)
        ns.disableLog("disableLog")
    }

    get api() {
        return this.#ns.hacknet
    }

    get allCompleted() {
        return (
            this.isComplete("ram") &&
            this.isComplete("servers") &&
            this.isComplete("level") &&
            this.isComplete("cores") &&
            this.isComplete("cache")
        )
    }

    get moneyHashCost() {
        return this.api.hashCost("Sell for Money", 1)
    }

    get production() {
        var production = 0
        for (let index = 0; index < this.api.numNodes(); index++) {
            production += this.api.getNodeStats(index)["production"]
        }
        return production
    }

    get cacheCapacityBottleneck() {
        for (const upgrade of this.api.getHashUpgrades()) {
            if (this.api.hashCost(upgrade, 1) > this.api.hashCapacity()) {
                return true
            }
        }
        return false
    }

    async buyUpgrade(upgrade, server) {
        if (!this.canAffordUpgrade(upgrade, server)) {
            return this.isComplete(upgrade)
        }
        if (upgrade == "servers") {
            return await this.buyServer()
        }
        var doUpgrade = this.#upgrades[upgrade]["upgradeFunc"]
        var upgradeMax = this.#upgrades[upgrade]["limit"]
        doUpgrade(server, 1)
        if (this.api.getNodeStats(server)[upgrade] >= upgradeMax) {
            return this.#markComplete(upgrade)
        }
        return this.isComplete(upgrade)
    }

    async buyServer() {
        if (this.canAffordUpgrade("servers", -1)) {
            let id = this.api.purchaseNode()
            await deployPayload(this.#ns, "hacknet-server-" + id)
            if (this.api.numNodes() >= this.#nodeLimit) {
                return this.#markComplete("servers")
            }
        }
        return this.isComplete("servers")
    }

    recommendUpgrade() {
        var cost = this.api.getPurchaseNodeCost()
        var upgrade = "servers"
        var server = -1
        // If we have no hacknet servers, the cheapest 
        // upgrade is always to buy a server.
        // Also if we can afford buying a new server, do so.
        if ((this.api.numNodes() < 1) || this.canAffordUpgrade(upgrade, server)) {
            return { "upgrade": upgrade, "server": server }
        }

        for (let index = 0; index < this.api.numNodes(); index++) {
            for (const upgradeCandidate of ["level", "cache", "cores", "ram"]) {
                // only upgrade the cache if there is an upgrade
                // that costs more than our current hash capacity
                if ((upgradeCandidate == "cache") && !this.cacheCapacityBottleneck) {
                    continue
                }
                let costCandidate = this.#upgrades[upgradeCandidate]["costFunc"](index, 1)
                if (costCandidate < cost) {
                    cost = costCandidate
                    upgrade = upgradeCandidate
                    server = index
                }
            }
        }
        return { "upgrade": upgrade, "server": server }
    }

    canAffordUpgrade(upgrade, server) {
        if (upgrade == "servers") {
            return canAfford(this.#ns, this.api.getPurchaseNodeCost())
        }

        var getCosts = this.#upgrades[upgrade]["costFunc"]
        var upgradeCost = getCosts(server, 1);
        return canAfford(this.#ns, upgradeCost)
    }

    moneyFromHashes() {
        let count = Math.floor(this.api.numHashes() / this.moneyHashCost)
        if (count < 1) {
            return
        }
        this.#ns.printf("Selling %s hashes for %s", (count * this.moneyHashCost), this.#ns.nFormat(1000000 * count, "($0.00a)"))
        this.api.spendHashes("Sell for Money", "", count)
    }

    isComplete(resource = isRequired("resource")) {
        return this.#completed.has(resource)
    }

    #markComplete(resource = isRequired("resource")) {
        this.#completed.add(resource)
        return this.isComplete(resource)
    }
}

function getUpgrades(ns) {
    return {
        "ram": {
            "limit": ns.formulas.hacknetServers.constants().MaxRam,
            "type": "ram",
            "costFunc": ns.hacknet.getRamUpgradeCost,
            "upgradeFunc": ns.hacknet.upgradeRam,
        },
        "cores": {
            "limit": ns.formulas.hacknetServers.constants().MaxCores,
            "type": "cores",
            "costFunc": ns.hacknet.getCoreUpgradeCost,
            "upgradeFunc": ns.hacknet.upgradeCore,
        },
        "level": {
            "limit": ns.formulas.hacknetServers.constants().MaxLevel,
            "type": "level",
            "costFunc": ns.hacknet.getLevelUpgradeCost,
            "upgradeFunc": ns.hacknet.upgradeLevel,
        },
        "cache": {
            "limit": ns.formulas.hacknetServers.constants().MaxCache,
            "type": "cache",
            "costFunc": ns.hacknet.getCacheUpgradeCost,
            "upgradeFunc": ns.hacknet.upgradeCache,
        },
    }
}
