/**
 * API.js - Comunicação com Google Sheets via Apps Script
 */

const FinanceAPI = {
    // A URL do seu Script do Google (Pode ser configurada no localStorage)
    getScriptUrl: function () {
        return localStorage.getItem('FINANCE_SCRIPT_URL') || 'https://script.google.com/macros/s/AKfycbxD2qTB26bK-lvE1cbNG_eJg8gouFUUhLdLyBNjiYG1yS7wpyvwo3HIQvK9z8QJZieLDg/exec';
    },

    setScriptUrl: function (url) {
        localStorage.setItem('FINANCE_SCRIPT_URL', url);
    },

    /**
     * Helper privado para realizar requisições e centralizar erro/CORS
     */
    _request: async function (params = {}) {
        const url = this.getScriptUrl();
        if (!url) throw new Error("URL do Script não configurada no sistema.");

        // Adiciona um parâmetro temporal para evitar cache agressivo no Apps Script
        const finalParams = { ...params, _t: new Date().getTime() };
        const queryString = new URLSearchParams(finalParams).toString();
        const fullUrl = `${url}?${queryString}`;

        try {
            const response = await fetch(fullUrl, { redirect: "follow" });

            if (!response.ok) {
                throw new Error(`Erro na conexão (Status: ${response.status})`);
            }

            const result = await response.json();

            if (result.status === "error") {
                throw new Error(result.message || "Erro retornado pelo servidor.");
            }

            return result;
        } catch (error) {
            console.error("FinanceAPI Error:", error);
            if (error.name === 'TypeError') {
                throw new Error("Erro de rede ou CORS. Verifique se o script foi publicado como 'Qualquer pessoa'.");
            }
            throw error;
        }
    },

    // Testar se a URL é válida e responde
    testConnection: async function () {
        const data = await this._request();
        return { success: true, data };
    },

    // Buscar resumo de dados (Dashboard)
    fetchSummary: async function () {
        return await this._request();
    },

    // Salvar novo lançamento
    saveTransaction: async function (transaction) {
        return await this._request({
            action: 'save',
            ...transaction
        });
    },

    // Excluir lançamento
    deleteTransaction: async function (rowId) {
        if (!rowId) throw new Error("ID da linha é obrigatório para exclusão.");
        return await this._request({
            action: 'delete',
            rowId: rowId
        });
    },

    // Atualizar lançamento existente
    updateTransaction: async function (rowId, transaction) {
        if (!rowId) throw new Error("ID da linha é obrigatório para atualização.");
        return await this._request({
            action: 'edit',
            rowId: rowId,
            ...transaction
        });
    },

    // Salvar configuração de metas
    saveMetas: async function (metasObj) {
        return await this._request({
            action: 'save_metas',
            metas: JSON.stringify(metasObj)
        });
    },

    // Formatação de Moeda
    formatCurrency: function (value) {
        // Converte para número se for string e remove caracteres não numéricos exceto ponto/vírgula
        const number = typeof value === 'string'
            ? parseFloat(value.replace(/[^\d,-]/g, '').replace(',', '.'))
            : value;

        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(number || 0);
    }
};
