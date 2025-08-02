import { EditorPanel } from "../modules/editor";
import { OutputPanel } from "../modules/output";

export let editorPanel: EditorPanel;
export let outputPanel: OutputPanel;

export const setEditorPanel = (panel: EditorPanel) => {
    editorPanel = panel;
}

export const setOutputPanel = (panel: OutputPanel) => {
    outputPanel = panel;
}
