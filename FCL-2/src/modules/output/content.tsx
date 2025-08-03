import { Fragment } from "preact/jsx-runtime";
import { Code } from "./code";
import { Console } from "./console";

export function Content() {
    return (
        <div id="output-split">
            <Console />
            <Code />
        </div>
    )
}
