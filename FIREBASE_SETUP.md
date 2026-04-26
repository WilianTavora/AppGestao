# Autenticação Firebase - Instruções de Configuração

## Passo 1: Criar Projeto no Firebase

1. Acesse https://console.firebase.google.com/
2. Clique em "Adicionar projeto" e siga o assistente
3. Dê um nome ao projeto (ex: "financial-atelier")
4. Desative o Google Analytics (opcional)
5. Clique em "Criar projeto"

## Passo 2: Configurar Authentication

1. No menu lateral, clique em **Criação** → **Authentication**
2. Clique em **Começar**
3. Vá até a aba **Sign-in method**
4. Ative **Email/senha**
5. Clique em **Salvar**

## Passo 3: Obter Configurações do Firebase

1. Clique no ícone de engrenagem ⚙️ (Configurações do projeto)
2. Em "Seus aplicativos", clique no ícone `</>` (Web)
3. Registre o app com um nickname (ex: "Financial Atelier Web")
4. Copie o objeto `firebaseConfig`

Exemplo do que você vai receber:
```javascript
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};
```

## Passo 4: Atualizar os Arquivos

Substitua o `firebaseConfig` em **dois arquivos**:

### Arquivo 1: public/login.html
- Localize a linha ~129 (após adicionar os scripts do Firebase)
- Substitua os valores de `firebaseConfig`

### Arquivo 2: public/index.html
- Localize a linha ~331 (antes do `initDashboard`)
- Substitua os valores de `firebaseConfig`

## Passo 5: Criar Usuários no Firebase

1. No Firebase Console, vá em **Authentication** → **Usuários**
2. Clique em "Adicionar usuário"
3. Adicione email e senha (ex: `admin@financial.com` / `senha123`)
4. Salve

## Passo 6: Testar

1. Acesse `login.html` no navegador
2. Entre com o usuário criado
3. Você será redirecionado para `index.html`
4. Ao clicar no botão de logout, volta para o login

## Notas Importantes

- Mantenha suas credenciais seguras
- Para produção, considere usar variáveis de ambiente
- O Firebase Auth é gratuito até certos limites
- Usuários devem ser criados manualmente no Firebase Console inicialmente
