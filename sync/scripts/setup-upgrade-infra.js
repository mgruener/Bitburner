import {
    buyServers,
    upgradeServers,
    buyHacknetNodes,
    upgradeHacknetNodes,
    getHacknetRamUpgrade,
    getHacknetCoreUpgrade,
    getHacknetLevelUpgrade,
    schedule,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var expected = 6
    var completed = []
    var serverRamLimit = 4096
    var hacknetNodeLimit = 8
    var hacknetRamUpgrade = getHacknetRamUpgrade(ns, hacknetNodeLimit)
    var hacknetCoreUpgrade = getHacknetCoreUpgrade(ns, hacknetNodeLimit)
    var hacknetLevelUpgrade = getHacknetLevelUpgrade(ns, hacknetNodeLimit)

    ns.disableLog("disableLog")
    var markCompleted = (name) => {
        if (!completed.includes(name)) {
            completed.push(name)
        }
    }

    while (completed.length < expected) {
        if (await buyServers(ns)) {
            markCompleted("buyServers")
        }
        if (await upgradeServers(ns, serverRamLimit)) {
            markCompleted("upgradeServers")
        }
        if (buyHacknetNodes(ns, hacknetNodeLimit)) {
            markCompleted("buyHacknetNodes")
        }
        if (upgradeHacknetNodes(ns, hacknetRamUpgrade)) {
            markCompleted("buyHacknetRam")
        }
        if (upgradeHacknetNodes(ns, hacknetCoreUpgrade)) {
            markCompleted("buyHacknetCores")
        }
        if (upgradeHacknetNodes(ns, hacknetLevelUpgrade)) {
            markCompleted("buyHacknetLevel")
        }
        if (!await schedule(ns, "/scripts/backdoor-worm.js")) {
            ns.print("Failed to execute backdoor-worm")
        }
        await ns.sleep(10000)
    }
}