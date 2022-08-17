import { getAllServers, applyFilter, filter_hackingSkill, filter_minMaxMoney, filter_adminRights, sortObjectsBy } from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var sortKey = "moneyMax"
    if (ns.args.length > 0) {
        sortKey = ns.args[0]
    }
    var skillFilter = filter_hackingSkill(ns.getHackingLevel())
    var maxMoneyFilter = filter_minMaxMoney(1)
    var hasAdminFilter = filter_adminRights(false)
    var servers = applyFilter(getAllServers(ns), [skillFilter, hasAdminFilter])
    servers = applyFilter(servers, [maxMoneyFilter], false)

    for (const server of sortObjectsBy(sortKey, servers)) {
        let name = server.hostname
        ns.tprintf(
            "%20s: m: %8s; gr: %4d; sm: %3d; wt: %10d; gt: %10d; ht: %10d",
            server.hostname,
            ns.nFormat(server.moneyMax, "($0.00a)"),
            server.serverGrowth,
            server.minDifficulty,
            ns.getWeakenTime(name),
            ns.getGrowTime(name),
            ns.getHackTime(name),
        )
    }
}
