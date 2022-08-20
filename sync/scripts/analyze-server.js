import { getAdditionalServerInfo, hasFormulas } from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var name = ns.args[0]
    var server = ns.getServer(name)
    var advancedServer = getAdditionalServerInfo(ns, server)

    ns.tprint(name)
    ns.tprintf("  Weaken time: %s", ns.nFormat(advancedServer.weakenTime / 1000, "00:00:00"))
    ns.tprintf("  Hack time: %s", ns.nFormat(advancedServer.hackTime / 1000, "00:00:00"))
    ns.tprintf("  Grow time: %s", ns.nFormat(advancedServer.growTime / 1000, "00:00:00"))
    ns.tprintf("  Max money: %s (%f)", ns.nFormat(server.moneyMax, "($0.00a)"), server.moneyMax)
    ns.tprintf("  Money: %s (%f)", ns.nFormat(server.moneyAvailable, "($0.00a)"), server.moneyAvailable)
    ns.tprintf("  Money threshold: %s (%f)", ns.nFormat(advancedServer.moneyThreshold, "($0.00a)"), advancedServer.moneyThreshold)
    ns.tprintf("  Max Regrow amount: %s (%f)", ns.nFormat(advancedServer.maxRegrowAmount, "($0.00a)"), advancedServer.maxRegrowAmount)
    ns.tprintf("  Growth rate: %d", server.serverGrowth)
    ns.tprintf("  Security min: %d", server.minDifficulty)
    ns.tprintf("  Security: %d", server.hackDifficulty)
    ns.tprintf("  Security threshold: %d", advancedServer.securityThreshold)
    ns.tprintf("  Weaken threads: %f", advancedServer.weakenThreads)
    ns.tprintf("  Grow threads: %f", advancedServer.growThreads)
    ns.tprintf("  Hack threads: %f", advancedServer.hackThreads)
    ns.tprintf("  Score: %s", ns.nFormat(advancedServer.score, '0.00e+0'))
    ns.tprintf("  TimeScore: %s/s", ns.nFormat(advancedServer.timeScore, "($0.00a)"))
}

