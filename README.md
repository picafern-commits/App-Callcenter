# AutoParts CallCenter

App de callcenter com Firebase Auth, Firestore e publicação automática no GitHub Pages.

## Publicação automática

Quando o projeto estiver ligado a um repositório GitHub, qualquer `push` para a branch `main` publica automaticamente a app no GitHub Pages.

No GitHub, confirmar:

1. Ir a `Settings > Pages`.
2. Em `Build and deployment`, escolher `GitHub Actions`.
3. Fazer `push` para `main`.

## Firebase

No Firebase Console:

1. Ativar `Authentication > Sign-in method > Email/Password`.
2. Criar o `Firestore Database`.
3. Publicar as regras de `firestore.rules`.

As contas novas entram como `Pendente` e devem ser aprovadas pelo Admin Master.

## App desktop / setup Windows

A app Electron abre por defeito:

`https://picafern-commits.github.io/App-Callcenter/`

Se não houver internet, tenta abrir a versão local incluída no instalador.

Para criar o setup:

```powershell
npm install
npm run setup
```

O instalador fica na pasta `dist`.

Em Windows também podes abrir:

`criar-setup-windows.bat`

Esse ficheiro instala as dependências e cria o setup automaticamente, desde que o Node.js LTS esteja instalado no computador.
