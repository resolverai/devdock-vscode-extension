import { createRoot } from 'react-dom/client';
import App from './App';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).vscode = window.acquireVsCodeApi();

const container = document.querySelector('#root');

if (container) {
  const root = createRoot(container);
  root.render(<App />);
}