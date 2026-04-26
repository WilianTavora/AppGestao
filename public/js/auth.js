/**
 * auth.js - Autenticação com Firebase
 */

const FirebaseAuth = {
    app: null,
    auth: null,
    currentUser: null,

    // Inicializa o Firebase (chame isso primeiro)
    init: function(config) {
        const { initializeApp, getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } = firebase;
        
        this.app = initializeApp(config);
        this.auth = getAuth(this.app);
        
        // Monitora estado de autenticação
        onAuthStateChanged(this.auth, (user) => {
            this.currentUser = user;
            if (user) {
                sessionStorage.setItem('firebaseUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName
                }));
            } else {
                sessionStorage.removeItem('firebaseUser');
            }
        });
    },

    // Verifica se usuário está logado
    isLoggedIn: function() {
        return !!sessionStorage.getItem('firebaseUser');
    },

    // Faz login com email e senha
    login: async function(email, password) {
        try {
            const { signInWithEmailAndPassword } = firebase.auth;
            await signInWithEmailAndPassword(this.auth, email, password);
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: this.getErrorMessage(error.code) 
            };
        }
    },

    // Faz logout
    logout: async function() {
        try {
            const { signOut } = firebase.auth;
            await signOut(this.auth);
            sessionStorage.removeItem('firebaseUser');
            window.location.href = 'login.html';
            return { success: true };
        } catch (error) {
            return { 
                success: false, 
                error: error.message 
            };
        }
    },

    // Verifica autenticação e redireciona
    requireAuth: function() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Obtém usuário atual
    getCurrentUser: function() {
        return this.currentUser;
    },

    // Converte códigos de erro do Firebase em mensagens em português
    getErrorMessage: function(errorCode) {
        const messages = {
            'auth/user-not-found': 'Usuário não encontrado.',
            'auth/wrong-password': 'Senha incorreta.',
            'auth/invalid-email': 'Email inválido.',
            'auth/user-disabled': 'Usuário desabilitado.',
            'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
            'auth/weak-password': 'Senha muito fraca.',
            'auth/email-already-in-use': 'Este email já está cadastrado.'
        };
        return messages[errorCode] || 'Ocorreu um erro. Tente novamente.';
    }
};
