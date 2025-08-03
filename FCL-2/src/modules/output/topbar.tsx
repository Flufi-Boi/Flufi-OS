import './topbar.css';
import { Component, ComponentChildren, FunctionalComponent } from "preact";
import { Play, FileInput, type LucideIcon } from 'lucide-preact';
import { generateID } from '../../ts/utils';
import { editorPanel, outputPanel } from '../../ts/layout';
import { compile } from '../../../fcl/link';
import { run } from './console';

interface TopbarButtonProps {
    children: ComponentChildren;
    func?: (e: PointerEvent) => void
}
export class TopbarButton extends Component<TopbarButtonProps> {
    private func: (event?: PointerEvent) => void;
    render({ children, func }) {
        this.func = func;
        return (
            <button class="output-topbar-button uiblock" onClick={func}>
                {children}
            </button>
        )
    }
    componentDidMount(): void {
        setTimeout(() => {
            this.func();
        }, 10);
    }
}

export function Topbar() {
    const play = () => {
        compileAndWrite();
        
        const outputElem = outputPanel.getElem();
        if (!outputElem) return
        const data = outputElem.textContent;

        run(data);
    };
    const compileAndWrite = () => {
        const outputElem = outputPanel.getElem();
        if (!outputElem) return

        outputElem.textContent = compile(editorPanel.getData());
    };
    return (
        <div class="output-topbar">
            <TopbarButton func={play}>
                <Play size={19.5}/>
            </TopbarButton>
            <TopbarButton func={compileAndWrite}>
                <FileInput size={19.5}/>
            </TopbarButton>
        </div>
    )
}