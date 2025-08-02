import { Ast } from "../ast";
import { FCLCompilerData, Script } from "../main";

// [--- utils ---]

export type ErrorData = {
    text: string;
    node?: Node;
}

export function error(context: ErrorData): string {
    return context.text;
}

export enum ErrorType {
    NoEntry
}

export const Errors: Record<keyof typeof ErrorType, (...args: any[]) => string> = {
    NoEntry: () => `no entry script specified or found.`
}

// [--- base classes ---]
export class Context {
    constructor(public scripts: Record<string, Script>) {

    }
}

export type NodeContext = {
    rootCtx: Context,
    module: Module
}

// [--- type base classes ---]
export abstract class Type {

}

// [--- type classes ---]

// [--- value base classes ---]
export abstract class Value {

}

// [--- value classes ---]
export class Module extends Value {
    constructor(public script: Script) {
        super();
    }
}

export function CompileScripts(scripts: Record<string, Script>, data?: FCLCompilerData): string {
    const ctx = new Context(scripts);
    console.log(scripts);
    
    const entry = scripts[data?.entry] ?? scripts["main"];

    if (!entry)
        throw Errors.NoEntry();
    
    const entryOut = CompileScript(entry, ctx);
    console.log(entryOut);

    return "funny";
}

export function CompileScript(script: Script, rootCtx: Context): Module {
    const mod = new Module(script);

    const ctx: NodeContext = {
        rootCtx: rootCtx,
        module: mod
    };

    return mod;
}

export function CompileNode(node: Node) {

}
