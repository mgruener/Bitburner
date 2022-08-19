import {
	getHackThreads,
} from "lib/utils.js";

/** @param {import("../..").NS } ns */
export async function main(ns) {
	var count = 2
	let startTime = "1"
	let procs = "2"
	while (count > 0) {
		ns.tprintf("startTime: %s; procs: %s", startTime, procs)
		let { startTime, procs } = unpackTest()
		count--
	}
}

function unpackTest() {
	let startTime = "a"
	let procs = "b"
	return { startTime, procs }
}