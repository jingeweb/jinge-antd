import './style.css';
import './docs.css';
import { bootstrap } from 'jinge';

import { App } from './App';
import { siteReady } from './i18n';

void siteReady.then(() => bootstrap(App, document.getElementById('root')!));
