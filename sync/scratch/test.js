/** @param {import("../..").NS } ns */
export async function main(ns) {
	var host = ns.args[0]
	var threads = parseInt(ns.args[1])
	var cores = parseInt(ns.args[2])
	var resultHack = ns.hackAnalyzeSecurity(threads, host)
	var resultGrow = ns.growthAnalyzeSecurity(threads, host, cores)
	var resultWeaken = ns.weakenAnalyze(threads, cores)
	ns.tprintf("h: %s; g: %s; w: -%s", resultHack, resultGrow, resultWeaken)
}
