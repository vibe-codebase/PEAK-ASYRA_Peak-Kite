import { createRoot } from 'react-dom/client';
import '@fontsource/young-serif/latin-400.css';
import '@fontsource/nunito/latin-500.css';
import '@fontsource/nunito/latin-700.css';
import '@fontsource/nunito/latin-800.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<App />);
