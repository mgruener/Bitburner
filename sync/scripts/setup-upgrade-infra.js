import {
    buyServers,
    upgradeServers,
    buyHacknetNodes,
    upgradeHacknetNodes,
    getHacknetRamUpgrade,
    getHacknetCoreUpgrade,
    getHacknetLevelUpgrade,
    schedule,
    getServersByRam,
    maxServerUpgrade,
    bulkServerUpgrade,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var count = Infinity
    if (ns.args.length > 0) {
        count = parseInt(ns.args[0])
    }

    var expected = 6
    var completed = []
    // with the ability to set a money limit with
    // the money-limit.js script, there is no need
    // to limit the size of our compute nodes here
    var serverRamLimit = ns.getPurchasedServerMaxRam()
    var hacknetNodeLimit = 8
    var hacknetRamUpgrade = getHacknetRamUpgrade(ns, hacknetNodeLimit)
    var doHacknet = false
    var hacknetCoreUpgrade = getHacknetCoreUpgrade(ns, hacknetNodeLimit)
    var hacknetLevelUpgrade = getHacknetLevelUpgrade(ns, hacknetNodeLimit)

    ns.disableLog("disableLog")
    var markCompleted = (name) => {
        if (!completed.includes(name)) {
            completed.push(name)
        }
    }

    while ((completed.length < expected) && (count > 0)) {
        let maxUpgrade = maxServerUpgrade(ns) > serverRamLimit ? serverRamLimit : maxServerUpgrade(ns)
        let serversByRam = getServersByRam(ns)
        let serverCount = ns.getPurchasedServers().length
        let largestServer = serverCount > 0 ? Object.keys(serversByRam).sort()[0] : 0

        ns.printf("MaxUpgrade: %d; largest Server: %d", maxUpgrade, largestServer)
        if ((maxUpgrade > 4) && (maxUpgrade > largestServer)) {
            if (await bulkServerUpgrade(ns, maxUpgrade) && maxUpgrade >= serverRamLimit) {
                markCompleted("buyServers")
                markCompleted("upgradeServers")
            }

        } else {
            if (await buyServers(ns)) {
                markCompleted("buyServers")
            }
            if (await upgradeServers(ns, serverRamLimit)) {
                markCompleted("upgradeServers")
            }
        }
        if (buyHacknetNodes(ns, hacknetNodeLimit)) {
            markCompleted("buyHacknetNodes")
        }
        if (await upgradeHacknetNodes(ns, hacknetRamUpgrade)) {
            markCompleted("buyHacknetRam")
        }
        // only start upgrading hacknet when we at least have
        // a basic set of purchased servers
        if (completed.includes("buyServers") && doHacknet) {
            if (await upgradeHacknetNodes(ns, hacknetCoreUpgrade)) {
                markCompleted("buyHacknetCores")
            }
            if (await upgradeHacknetNodes(ns, hacknetLevelUpgrade)) {
                markCompleted("buyHacknetLevel")
            }
        }
        if (!await schedule(ns, "/scripts/backdoor-worm.js")) {
            ns.print("Failed to execute backdoor-worm")
        }
        count--
        if (count > 0) {
            await ns.sleep(10000)
        }
    }
}