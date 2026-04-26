/**
 * Google Apps Script - Backend para Gestão Financeira "Wtavora5"
 https://script.google.com/macros/s/AKfycbxD2qTB26bK-lvE1cbNG_eJg8gouFUUhLdLyBNjiYG1yS7wpyvwo3HIQvK9z8QJZieLDg/exec
 */

function doGet(e) {
  try {
    var ss = getSpreadsheet();
    var sheet = getOrCreateSheet(ss);
    
    // Tratamos ações via GET (save, edit, delete)
    if (e.parameter && e.parameter.action) {
      var action = e.parameter.action;
      
      if (action === 'save' || action === 'edit') {
        var data = e.parameter.data;
        var descricao = e.parameter.descricao;
        var categoria = e.parameter.categoria;
        var tipo = e.parameter.tipo;
        var valor = parseFloat(e.parameter.valor);
        var status = e.parameter.status;
        
        var dateObj = data;
        if (typeof data === 'string' && data.includes('-')) {
          var parts = data.split('-');
          dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
        }
        
        var rowData = [dateObj, descricao, categoria, tipo, valor, status];
        
        if (action === 'save') {
          sheet.appendRow(rowData);
        } else {
          var rowId = parseInt(e.parameter.rowId);
          if (!rowId || rowId <= 1) throw new Error("ID de linha inválido para edição.");
          sheet.getRange(rowId, 1, 1, 6).setValues([rowData]);
        }
        
        return ContentService.createTextOutput(JSON.stringify({status: "success"}))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      if (action === 'delete') {
        var rowId = parseInt(e.parameter.rowId);
        if (!rowId || rowId <= 1) throw new Error("ID de linha inválido para exclusão.");
        sheet.deleteRow(rowId);
        return ContentService.createTextOutput(JSON.stringify({status: "success"}))
          .setMimeType(ContentService.MimeType.JSON);
      }

      if (action === 'save_metas') {
        var metasData = JSON.parse(e.parameter.metas);
        var metasSheet = getOrCreateMetasSheet(ss);
        
        // Limpar dados existentes (mantendo cabeçalho)
        var lastRow = metasSheet.getLastRow();
        if (lastRow > 1) {
          metasSheet.getRange(2, 1, lastRow - 1, 2).clearContent();
        }
        
        // Inserir novos dados
        var newRows = [];
        for (var cat in metasData) {
          newRows.push([cat, metasData[cat]]);
        }
        if (newRows.length > 0) {
          metasSheet.getRange(2, 1, newRows.length, 2).setValues(newRows);
        }
        
        return ContentService.createTextOutput(JSON.stringify({status: "success"}))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // Modo Padrão (Ler Sumário e Metas)
    var dataRows = sheet.getDataRange().getValues();
    var summary = calculateSummary(dataRows);
    
    // Obter Metas
    var metasSheet = getOrCreateMetasSheet(ss);
    var metasRows = metasSheet.getDataRange().getValues();
    var metasConfig = {};
    for (var i = 1; i < metasRows.length; i++) {
       if (metasRows[i][0]) {
         metasConfig[metasRows[i][0]] = parseFloat(metasRows[i][1]) || 0;
       }
    }
    summary.metasConfig = metasConfig;
    
    return ContentService.createTextOutput(JSON.stringify(summary))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error", 
      message: error.toString() + (error.stack ? " (" + error.stack + ")" : "")
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

// Mantemos doPost apenas por compatibilidade com scripts antigos
function doPost(e) {
  return doGet(e);
}

// Função para obter a planilha 
function getSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (!ss) {
    throw new Error("Erro Crítico: A planilha ativa não foi encontrada. Você DEVE criar este script clicando em 'Extensões -> Apps Script' DE DENTRO da sua planilha do Google Sheets.");
  }
  return ss;
}

// Função para garantir que a aba existe e tem cabeçalhos
function getOrCreateSheet(ss) {
  var name = "Lancamentos";
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(["Data", "Descrição", "Categoria", "Tipo", "Valor", "Status"]);
    sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#f3f4f5");
  }
  return sheet;
}

function getOrCreateMetasSheet(ss) {
  var name = "Metas";
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(["Categoria", "Meta"]);
    sheet.getRange("A1:B1").setFontWeight("bold").setBackground("#f3f4f5");
    
    // Valores padrão iniciais
    var defaultMetas = [
      ["Alimentação", 1500],
      ["Transporte", 800],
      ["Moradia", 4500],
      ["Lazer", 600],
      ["Saúde", 1000]
    ];
    sheet.getRange(2, 1, defaultMetas.length, 2).setValues(defaultMetas);
  }
  return sheet;
}

function calculateSummary(data) {
  var totalReceitas = 0;
  var totalDespesas = 0;
  var totalReceitasMes = 0;
  var totalDespesasMes = 0;
  var transacoes = [];
  var categorias = {};
  
  var now = new Date();
  var currentMonth = now.getMonth();
  var currentYear = now.getFullYear();

  if (data.length <= 1) {
    return { saldo: 0, totalReceitas: 0, totalDespesas: 0, transacoes: [], categorias: {} };
  }

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    
    // Tratamento robusto de data
    var dataTrans = row[0];
    if (!(dataTrans instanceof Date)) {
      dataTrans = new Date(dataTrans);
    }
    
    // Se a data for inválida, pular
    if (isNaN(dataTrans.getTime())) continue;

    var valor = parseFloat(row[4]) || 0;
    var tipo = row[3];
    var cat = row[2];

    // Totais gerais
    if (tipo === "Receita") {
      totalReceitas += valor;
    } else {
      totalDespesas += valor;
    }

    // Totais e categorias do mês atual
    if (dataTrans.getMonth() === currentMonth && dataTrans.getFullYear() === currentYear) {
      if (tipo === "Receita") {
        totalReceitasMes += valor;
      } else {
        totalDespesasMes += valor;
        categorias[cat] = (categorias[cat] || 0) + valor;
      }
    }
    
    transacoes.push({
      rowId: i + 1, // Guardamos a linha física para editar/excluir depois
      data: dataTrans,
      descricao: row[1],
      categoria: row[2],
      tipo: row[3],
      valor: valor,
      status: row[5]
    });
  }

  // Ordenar transações por data (mais recentes primeiro) e pegar as últimas 10
  transacoes.sort(function(a, b) { return b.data - a.data; });
  var recentTransactions = transacoes.slice(0, 10);

  return {
    saldo: totalReceitas - totalDespesas,
    totalReceitas: totalReceitasMes,
    totalDespesas: totalDespesasMes,
    transacoes: recentTransactions,
    categorias: categorias
  };
}


