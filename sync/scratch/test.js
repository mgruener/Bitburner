/** @param {import("../..").NS } ns */
export async function main(ns) {
	var host = ns.args[0]
	var growFactor = ns.args[1]
	var cores = ns.args[2]
	var t = ns.growthAnalyze(host, growFactor, cores)
	ns.tprintf("%f", t)
}
