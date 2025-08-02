import { FCL as FCL2 } from "./v2/main";

export enum FCLVersion {
    FCL2
}

export function compile(code: string, version: FCLVersion = FCLVersion.FCL2) {
    switch (version) {
        case FCLVersion.FCL2: {
            const ctx = new FCL2();
            ctx.setMainScript(code);
            return ctx.compile();
        }
    }

    return "";
}