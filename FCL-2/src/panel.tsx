import { Component, Fragment, JSX, VNode } from "preact";
import { generateID } from "./ts/utils";

export abstract class Panel extends Component {
    panelName: string;
    id: string = generateID();

	render(content: VNode): VNode {
        return (
            <div class="panel" id={this.id}>
                {content}
            </div>
        )
	}
}
