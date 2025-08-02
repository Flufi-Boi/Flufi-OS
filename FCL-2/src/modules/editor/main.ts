import { sleep } from "../../ts/utils";

// @ts-ignore
const id = window.panelID;

let elem;

while (!(elem = document.getElementById(`${id}-text`)))
    await sleep(10);

console.log(elem);
