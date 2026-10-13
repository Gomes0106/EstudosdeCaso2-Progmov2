# Meu dinheiro

Aplicativo de controle financeiro pessoal desenvolvido com React Native e Expo para Android e iOS. Organize receitas e despesas e acompanhe seu saldo em reais.

## Funcionalidades

- Cadastro de movimentações com descrição, valor, tipo, categoria e data.
- Resumo do saldo atual, total de receitas e total de despesas.
- Busca por descrição e filtros por tipo e categoria.
- Lista de movimentações ordenada pelas datas mais recentes.
- Visualização de detalhes, edição e exclusão com confirmação.
- Validação de valores e datas no formato DD/MM/AAAA.
- Armazenamento local com AsyncStorage, mantendo os registros entre sessões.

Categorias disponíveis: Alimentação, Transporte, Moradia, Saúde, Educação, Lazer, Salário e Outros.

Os registros ficam no aparelho, sem login ou sincronização em nuvem. O saldo considera todas as movimentações cadastradas, independentemente dos filtros da lista.

## Tecnologias

| Tecnologia | Versão declarada |
| --- | --- |
| Expo | ~57.0.28 (SDK 57) |
| React Native | 0.86.3 |
| React | 19.2.3 |
| AsyncStorage | 2.2.0 |

Código escrito em JavaScript.

## Como rodar

### Pré-requisitos

- Node.js 22.13 ou superior e npm.
- Expo Go compatível com o SDK 57 instalado no celular.
- Computador e celular conectados à mesma rede Wi-Fi.

### Instalação

Baixe ou clone este repositório e abra um terminal na pasta que contém o arquivo `package.json`.

Instale as dependências usando o arquivo de lock do projeto:

```bash
npm ci
```

Inicie o servidor de desenvolvimento:

```bash
npm start
```

No iPhone, entre na mesma conta Expo no computador (`npx expo login`) e no Expo Go, conforme a [documentação do Expo](https://docs.expo.dev/get-started/start-developing/).

No Android, abra o Expo Go e escaneie o QR Code exibido no terminal. No iPhone, escaneie o QR Code com a câmera e abra o link no Expo Go.

Para encerrar o servidor, pressione `Ctrl+C`.

### Emuladores

Com um emulador Android configurado e aberto:

```bash
npm run android
```

Para abrir no simulador iOS, é necessário um Mac com Xcode e o simulador configurados:

```bash
npm run ios
```

No Windows, use um iPhone físico com Expo Go para testar no iOS.

## Uso do aplicativo

1. Toque em **Nova** para adicionar uma movimentação.
2. Selecione receita ou despesa e preencha descrição, valor, categoria e data.
3. Toque em **Salvar movimentação** para atualizar o resumo financeiro.
4. Use a busca e os filtros para localizar registros.
5. Toque em uma movimentação para consultar detalhes, editar ou excluir.

## Problemas comuns

### Erro ao resolver o AsyncStorage

Se aparecer `Unable to resolve "@react-native-async-storage/async-storage"`, confirme que instalou as dependências na pasta do projeto. Para instalar a biblioteca com uma versão compatível com o Expo:

```bash
npx expo install @react-native-async-storage/async-storage
```

Pare o servidor e reinicie limpando o cache:

```bash
npx expo start --clear
```

### Celular não conecta ao servidor

Confira se o computador e o celular estão na mesma rede e se o firewall permite a conexão do servidor de desenvolvimento.

### PowerShell bloqueia scripts do npm ou npx

No Windows, use `npm.cmd` e `npx.cmd` no lugar de `npm` e `npx`, ou execute os comandos no Prompt de Comando.

## Estrutura

```text
App.js             Interface, controle de movimentações e armazenamento
index.js           Entrada do aplicativo
app.json           Configuração do Expo
assets/            Ícones e imagens
package.json       Dependências e comandos
package-lock.json  Versões resolvidas das dependências
LICENSE            Licença do projeto
```

## Referências

- [Documentação do Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [Como iniciar o app no Expo](https://docs.expo.dev/get-started/start-developing/)

## Licença

Este repositório contém uma licença MIT. Consulte o arquivo [LICENSE](LICENSE).

