import { AlertCircle, Bug, Info, MessageCircle, MessageCircleMore, OctagonAlert, TriangleAlert, XCircle } from "lucide-preact"
import { render } from "preact"

export enum LogType {
    info,
    debug,
    warn,
    error,
}
export type Log = {
    type: LogType,
    data: Array<any>
}

export type jsOutput = {
    logs: Array<Log>
}

export function runJS(data: string): jsOutput {
    const out: jsOutput = {
        logs: []
    }

    const newConsole: Console = {
        assert: () => {},
        clear: () => { out.logs = []; },

        count: () => {},
        countReset: () => {},

        group: () => {},
        groupCollapsed: () => {},
        groupEnd: () => {},

        time: () => {},
        timeLog: () => {},
        timeStamp: () => {},
        timeEnd: () => {},
        
        trace: () => {},

        debug: (...args) => { out.logs.push({ type: LogType.debug, data: args }) },
        log: (...args) => { out.logs.push({ type: LogType.info, data: args }) },
        info: (...args) => { out.logs.push({ type: LogType.info, data: args }) },
        warn: (...args) => { out.logs.push({ type: LogType.warn, data: args }) },
        error: (...args) => { out.logs.push({ type: LogType.error, data: args }) },

        table: () => {},
        dir: () => {},
        dirxml: () => {},
    }

    eval(`(function(console){${data}})`)(newConsole);

    return out;
}

export function run(data: string): void {
    const output: HTMLElement | null = document.getElementById("output-console");
    const out = runJS(data);
    RenderConsole(out.logs);
}

export function RenderLog(log: Log) {
    const iconMap: Record<LogType, preact.JSX.Element> = {
        [LogType.debug]: <Bug />,
        [LogType.info]: <MessageCircleMore />,
        [LogType.warn]: <TriangleAlert />,
        [LogType.error]: <OctagonAlert />
    }

    const RenderLogElem = (item) => {
        switch (typeof item) {
            default:
                return (
                    <p class="console-text">{item.toString()}</p>
                )
        }
    }

    return (
        <div>
            {iconMap[log.type]}
            <div>
                {log.data.map(e => RenderLogElem(e))}
            </div>
        </div>
    )
}

export function RenderConsole(logs: Array<Log>) {
    const consoleDiv: HTMLElement = document.getElementById("output-console");
    console.log(logs);
    for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        const temp = document.createElement("div");
        render(<RenderLog {...log} />, temp);
        if (temp.firstChild) {
            consoleDiv.appendChild(temp.firstChild);
        }
    }
}

export function Console() {
    return (
        <div id="output-console" />
    )
}
