import {
    getAllServers,
    applyFilter,
    filter_hackingSkill,
    filter_minMaxMoney,
    filter_adminRights,
    sortObjectBy,
    //sortByFunctionValue,
    sortByKey,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    // can be used to add specialized sort functions 
    // if necessary, but most information should be
    // already injected in the server object by getAdditionalServerInfo()
    // during the getAllServers() call
    var sortTypes = {
        // "weakenTime": sortByFunctionValue(ns.getWeakenTime),
        // "growTime": sortByFunctionValue(ns.getGrowTime),
        // "hackTime": sortByFunctionValue(ns.getHackTime),
    }

    var sortType = "moneyMax"
    if (ns.args.length > 0) {
        sortType = ns.args[0]
    }
    var output = ""
    if (ns.args.length > 1) {
        output = ns.args[1]
    }
    var sortFunc = sortByKey(sortType)
    if (Object.keys(sortTypes).includes(sortType)) {
        sortFunc = sortTypes[sortType]
    }

    var skillFilter = filter_hackingSkill(ns.getHackingLevel())
    var maxMoneyFilter = filter_minMaxMoney(1)
    var hasAdminFilter = filter_adminRights(false)
    var servers = applyFilter(getAllServers(ns), [skillFilter, hasAdminFilter])
    servers = applyFilter(servers, [maxMoneyFilter], false)

    for (const server of sortObjectBy(servers, sortFunc)) {
        if (output != "") {
            ns.tprintf("%s", server[output])
            continue
        }
        ns.tprintf(
            "%20s: sc: %8s; tsc: %8s; m: %8s; gr: %4d; sm: %3d; wt: %8s; gt: %8s; ht: %8s",
            server.hostname,
            ns.nFormat(server.score, '0.00e+0'),
            ns.nFormat(server.timeScore, "($0.00a)"),
            ns.nFormat(server.moneyMax, "($0.00a)"),
            server.serverGrowth,
            server.minDifficulty,
            ns.nFormat(server.weakenTime / 1000, "00:00:00"),
            ns.nFormat(server.growTime / 1000, "00:00:00"),
            ns.nFormat(server.hackTime / 1000, "00:00:00"),
        )
    }
}