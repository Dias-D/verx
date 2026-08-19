import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { store } from './store';
import { theme } from './theme';
import { Dashboard } from './pages/Dashboard';
import { Produtores } from './pages/Produtores';

/**
 * Casca da aplicação a partir da etapa F1: Redux Provider + ThemeProvider
 * (styled-components) + Router, com as duas rotas decididas em
 * frontend-teste-brain-ag.md#1 (dashboard e produtores). "/produtores" é só
 * um placeholder até a etapa F2 — ver pages/Produtores.tsx.
 */
function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtores" element={<Produtores />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
