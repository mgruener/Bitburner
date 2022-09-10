/** @param {import("../..").NS } ns */
export async function main(ns) {
	//var server = ns.getServer("hacknet-node-0")
	//for (const key of Object.keys(server)) {
	//	ns.tprintf("%s: %s", key, server[key])
	//}

	var sleeve = ns.sleeve.getInformation(0)
	ns.tprintf("jobs: %s", sleeve.jobs)
	ns.tprintf("titles: %s", sleeve.jobTitle)
	ns.tprintf("karma: %s", ns.heart.break())
}
