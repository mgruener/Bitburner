/** @param {import("../..").NS } ns */
export async function main(ns) {
	var multipliers = ns.getBitNodeMultipliers()
	for (const key in multipliers) {
		if (multipliers[key] != 1) {
			ns.tprintf("%27s: %s", key, multipliers[key])
		}
	}
}
