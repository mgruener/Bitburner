import {
    getAllServers,
    applyFilter,
    filter_hackingSkill,
    filter_minMaxMoney,
    filter_adminRights,
    sortObjectBy,
    sortByFunctionValue,
    sortByKey,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
    var sortTypes = {
        "weakenTime": sortByFunctionValue(ns.getWeakenTime),
        "growTime": sortByFunctionValue(ns.getGrowTime),
        "hackTime": sortByFunctionValue(ns.getHackTime),
        "score": sortByScore(),
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
        let name = server.hostname
        if (output != "") {
            ns.tprintf("%s", server[output])
            continue
        }
        ns.tprintf(
            "%20s: score: %s; m: %8s; gr: %4d; sm: %3d; wt: %10d; gt: %10d; ht: %10d",
            server.hostname,
            ns.nFormat(serverScore(server), '0.00e+0'),
            ns.nFormat(server.moneyMax, "($0.00a)"),
            server.serverGrowth,
            server.minDifficulty,
            ns.getWeakenTime(name),
            ns.getGrowTime(name),
            ns.getHackTime(name),
        )
    }
}

export function serverScore(server) {
    return server.moneyMax / (server.minDifficulty / server.serverGrowth)
}

export function sortByScore() {
    return (function (x, y) {
        if (serverScore(x) < serverScore(y)) {
            return -1
        }
        if (serverScore(x) > serverScore(y)) {
            return 1
        }
        return 0
    })
}