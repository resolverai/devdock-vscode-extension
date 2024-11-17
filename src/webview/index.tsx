import { createRoot } from 'react-dom/client';
import Dashboard from './home/dashboard';
import { LoaderProvider } from '../webview/Loader/Loader'; // Import LoaderProvider

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).vscode = window.acquireVsCodeApi();

const container = document.querySelector('#root');

if (container) {
  const root = createRoot(container);

  // Wrap Dashboard with LoaderProvider
  root.render(
    <LoaderProvider>
      <Dashboard />
    </LoaderProvider>
  );
}
