import {
	getHackThreads,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
	var name = "sigma-cosmetics"
	var server = ns.getServer(name)
	var money = server.moneyAvailable - (server.moneyAvailable * 0.01)
	var t1 = getHackThreads(ns, server)
	var t2 = Math.floor(money / (ns.hackAnalyze(name) * server.moneyAvailable))
	//var threads = ns.hackAnalyzeThreads(name, predicted)
	//var hacked = await ns.hack(name, { threads: 1 })
	ns.tprintf("t1: %f, t2: %f", t1, t2)
}
