import { Provider } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { store } from './store';
import { theme } from './theme';

/**
 * Casca da aplicação nesta etapa (F0 — fundação): só prova que Redux Provider
 * e ThemeProvider (styled-components) estão conectados. Rotas (dashboard,
 * produtores) e as telas de verdade chegam em F1/F2, quando `pages/` deixa
 * de estar vazio.
 */
function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <main>
          <h1>Brain Agriculture</h1>
          <p>
            Fundação do frontend concluída — dashboard e cadastro de produtor
            chegam nas próximas etapas.
          </p>
        </main>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
