import { Fragment, VNode } from "preact";
import { Panel } from "../panel";
import { Topbar } from "./output/topbar";
import { setOutputPanel } from "../ts/layout";

import "./output/style.css";
import { Content } from "./output/content";

export class OutputPanel extends Panel {
    panelName = "output";

    render(content: VNode): VNode {
        return super.render(
            <Fragment>
                <Topbar />
                <Content />
            </Fragment>
        )
    }

    componentDidMount(): void {
        setOutputPanel(this);
    }

    getElem(): HTMLParagraphElement {
        const elem = document.getElementById("output-code")
        if (elem == null)
            throw "no output";
        return elem as HTMLParagraphElement;
    }
}
