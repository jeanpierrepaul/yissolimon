import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ecouterInstallation } from './components/installer';
import '@fontsource-variable/nunito';
import './index.css';

ecouterInstallation();
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
