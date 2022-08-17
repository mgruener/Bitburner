import {
    applyFilter,
    filter_adminRights,
    filter_minRamAvailable,
    getAdditionalServerInfo,
    getAllServers,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    const targetName = ns.args[0]
    await ns.sleep(10000)

    while (true) {
        let target = ns.getServer(targetName)
        let addonInfo = getAdditionalServerInfo(ns, target)
        let attackers = getAttackers(ns)

        if (Object.keys(attackers).length <= 0) {
            ns.print("No attackers available, sleeping 10 seconds before retrying")
            await ns.sleep(10000)
            continue
        }

        if (target.hackDifficulty > addonInfo.securityThreshold) {
            await performWeaken(ns, target, attackers)
        } else if (target.moneyAvailable < addonInfo.moneyThreshold) {
            await performGrow(ns, target, attackers)
        } else {
            await performHack(ns, target, attackers)
        }
    }
}

export function getAttackers(ns) {
    var hasAdminFilter = filter_adminRights(true)
    // 1.6G base script size + 0.15G (weaken/grow)
    // hack() requires 0.1G so it works everywhere where weaken/grow works
    var ramFilter = filter_minRamAvailable(ns.getScriptRam("/payload/weaken-only.js"))
    return applyFilter(getAllServers(ns), [hasAdminFilter, ramFilter], false, false)
}

export async function performWeaken(ns, target, attackers) {
    var addonInfo = getAdditionalServerInfo(ns, target)
    var waitTime = ns.getWeakenTime(target.hostname) + 1000
    var requiredThreads = addonInfo.weakenThreads
    var scriptRam = ns.getScriptRam("/payload/weaken-only.js")
    ns.printf("Weaken %s (%d):", target.hostname, requiredThreads)
    for (const name in attackers) {
        let serverThreads = Math.floor((attackers[name].maxRam - attackers[name].ramUsed) / scriptRam)
        if (serverThreads > requiredThreads) {
            serverThreads = requiredThreads
        }
        let pid = ns.exec("/payload/weaken-only.js", name, serverThreads, target.hostname, serverThreads)
        if (pid == 0) {
            ns.tprintf("Error while weakening %s from %s", target.hostname, name)
            continue
        }
        requiredThreads = requiredThreads - serverThreads
        ns.printf("  Weakening with %s (%d / %d)", name, serverThreads, requiredThreads)
        if (requiredThreads <= 0) {
            break
        }
    }
    await ns.sleep(waitTime)
}

export async function performGrow(ns, target, attackers) {
    var addonInfo = getAdditionalServerInfo(ns, target)
    var waitTime = ns.getGrowTime(target.hostname) + 1000
    var requiredThreads = addonInfo.growThreads
    var scriptRam = ns.getScriptRam("/payload/grow-only.js")
    ns.printf("Grow %s (%d):", target.hostname, requiredThreads)
    for (const name in attackers) {
        let serverThreads = Math.floor((attackers[name].maxRam - attackers[name].ramUsed) / scriptRam)
        if (serverThreads > requiredThreads) {
            serverThreads = requiredThreads
        }
        let pid = ns.exec("/payload/grow-only.js", name, serverThreads, target.hostname, serverThreads)
        if (pid == 0) {
            ns.printf("Error while growing %s from %s", target.hostname, name)
            continue
        }
        requiredThreads = requiredThreads - serverThreads
        ns.printf("  Growing with %s (%d / %d)", name, serverThreads, requiredThreads)
        if (requiredThreads <= 0) {
            break
        }
    }
    await ns.sleep(waitTime)
}

export async function performHack(ns, target, attackers) {
    var addonInfo = getAdditionalServerInfo(ns, target)
    var waitTime = ns.getHackTime(target.hostname) + 1000
    var requiredThreads = addonInfo.hackThreads
    var scriptRam = ns.getScriptRam("/payload/hack-only.js")
    ns.printf("Hack %s (%d):", target.hostname, requiredThreads)
    for (const name in attackers) {
        let serverThreads = Math.floor((attackers[name].maxRam - attackers[name].ramUsed) / scriptRam)
        if (serverThreads > requiredThreads) {
            serverThreads = requiredThreads
        }
        let pid = ns.exec("/payload/hack-only.js", name, serverThreads, target.hostname, serverThreads)
        if (pid == 0) {
            ns.tprintf("Error while hacking %s from %s", target.hostname, name)
            continue
        }
        requiredThreads = requiredThreads - serverThreads
        ns.printf("  Hacking with %s (%d / %d)", name, serverThreads, requiredThreads)
        if (requiredThreads <= 0) {
            break
        }
    }
    await ns.sleep(waitTime)
}