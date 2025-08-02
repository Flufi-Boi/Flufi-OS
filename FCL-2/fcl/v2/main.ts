import { Ast } from "./ast";
import * as JS from "./langs/tojs";

export type FCLScriptCode = string | Ast;
export type FCLScript = FCLScriptCode | Script;
export enum FCLTarget {
    JS
}
export type FCLCompilerData = {
    entry: string
}

export class Script {
    ast: Ast;

    constructor(code: FCLScriptCode) {
        if (code instanceof Ast)
            this.ast = code;
        else
            this.ast = new Ast(code);
    }
}

export class FCL {
    private scripts: Record<string, Script> = {}
    public target: FCLTarget = FCLTarget.JS;

    public setScript(name: string, script: FCLScript): void {
        this.scripts[name] = script instanceof Script ? script : this.parseScript(script);
    }
    public setMainScript(script: FCLScript): void {
        this.setScript("main", script);
    }

    public parseScript(code: FCLScriptCode): Script {
        return new Script(code);
    }

    public compile(target?: FCLTarget): string {
        if (target)
            this.target = target;

        switch (this.target) {
            case FCLTarget.JS: return JS.CompileScripts(this.scripts);
        }

        throw "unknown target";
    }
}
