import { Fragment, render} from 'preact';
import './styles.css';

import { EditorPanel } from './modules/editor';
import { OutputPanel } from './modules/output';

import "./ts/store"

export function App() {
	return (
		<Fragment>
			<EditorPanel />
			<OutputPanel />
		</Fragment>
	);
}

render(<App/>, document.getElementById('content'));
