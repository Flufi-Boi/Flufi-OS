import { VNode } from "preact";
import { Panel } from "../panel";
import { EmbedScript } from "./embedScript";
import * as layout from "../ts/layout";
import { db } from "../ts/store";
import "./editor/main.css";

export class EditorPanel extends Panel {
    panelName = "output";

    constructor() {
        super();
        layout.setEditorPanel(this);
    }

    render(): VNode {
        const data = (
            <>
                <textarea class="code" id={`${this.id}-text`}/>
            </>
        );

        return super.render(data);
    }

    getElem(): HTMLTextAreaElement {
        return document.getElementById(`${this.id}-text`) as HTMLTextAreaElement;
    }
    
    getData(): string {
        return this.getElem().value ?? ""
    }

    componentDidMount(): void {
        const tx = db.transaction("editor", "readwrite");
        const store: IDBObjectStore = tx.objectStore("editor");
        const req = store.get("input");
        req.onsuccess = (e) => {
            const textElem = this.getElem();
            const req = e.target as IDBRequest;
            this.getElem().value = req.result;
        }
        const inputUpdate = () => {
            const textElem = this.getElem();
            const tx = db.transaction("editor", "readwrite");
            const store: IDBObjectStore = tx.objectStore("editor");
            const req = store.put(textElem.value, "input");
            req.onerror = (e) => console.error(e);
        };
        this.getElem().addEventListener("input", inputUpdate);
        // @ts-ignore
        this.getElem().inputUpdate = inputUpdate;

        this.getElem().addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();

                const start = this.selectionStart;
                const end = this.selectionEnd;
                const value = this.value;

                if (start === end) {
                    // Single caret position (no selection)
                    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                    const lineEnd = value.indexOf('\n', start);
                    const currentLine = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);

                    if (e.shiftKey) {
                        // Unindent line if it starts with a tab or 4 spaces
                        if (currentLine.startsWith('\t')) {
                            this.value = value.slice(0, lineStart) + currentLine.slice(1) + value.slice(lineEnd === -1 ? value.length : lineEnd);
                            const offset = start - 1 > lineStart ? 1 : 0;
                            this.selectionStart = this.selectionEnd = start - offset - 1;
                        } else if (currentLine.startsWith('    ')) {
                            this.value = value.slice(0, lineStart) + currentLine.slice(4) + value.slice(lineEnd === -1 ? value.length : lineEnd);
                            const offset = start - 4 >= lineStart ? 4 : 0;
                            this.selectionStart = this.selectionEnd = start - offset;
                        }
                    } else {
                        // Insert tab character at caret
                        this.value = value.slice(0, start) + '    ' + value.slice(end);
                        this.selectionStart = this.selectionEnd = start + 4;
                    }
                } else {
                    // Selection exists – treat like code editor multi-line indent
                    const selected = value.slice(start, end);

                    if (e.shiftKey) {
                        const modified = selected.replace(/^(\t| {4})/gm, '');
                        this.value = value.slice(0, start) + modified + value.slice(end);
                        const removed = selected.length - modified.length;
                        this.selectionStart = start;
                        this.selectionEnd = end - removed;
                    } else {
                        const modified = selected.replace(/^/gm, '    ');
                        this.value = value.slice(0, start) + modified + value.slice(end);
                        this.selectionStart = start;
                        this.selectionEnd = end + (modified.length - selected.length);
                    }
                }
            }
            // @ts-ignore
            this.inputUpdate();
        });
    }
}
