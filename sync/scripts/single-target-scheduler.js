import {
    applyFilter,
    filter_adminRights,
    filter_minRamAvailable,
    getAdditionalServerInfo,
    getAllServers,
    performAttack,
    getGrowAttack,
    getWeakenAttack,
    getHackAttack,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    const targetName = ns.args[0]
    const growAttack = getGrowAttack(ns)
    const weakenAttack = getWeakenAttack(ns)
    const hackAttack = getHackAttack(ns)
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
            await ns.sleep(performAttack(ns, weakenAttack, target, attackers))
        } else if (target.moneyAvailable < addonInfo.moneyThreshold) {
            await ns.sleep(performAttack(ns, growAttack, target, attackers))
        } else {
            await ns.sleep(performAttack(ns, hackAttack, target, attackers))
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

