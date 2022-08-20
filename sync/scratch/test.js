/** @param {import("../..").NS } ns */
export async function main(ns) {
	var test = {
		"foo": "bar",
		"bla": "blubb",
	}
	var test2 = { ...test, "foo": "muh" }
	ns.tprintf("Result: %s", test2["foo"])
}