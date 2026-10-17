import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { UiTextProvider } from './contexts/UiTextContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UiTextProvider>
      <App />
    </UiTextProvider>
  </StrictMode>,
);
