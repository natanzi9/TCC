// ===== CONFIGURAÇÃO DA API GROQ =====
const GROQ_API_KEY = "";

// ===== DESTACA O BOTÃO DA PÁGINA ATUAL NA NAVBAR =====
function colorir() {
    const el = document.getElementById("home");
    if (el) el.style.border = "2px solid #045cac";
}

function coloriraditens() {
    const el = document.getElementById("itens");
    if (el) el.style.border = "2px solid #045cac";
}

function colorirestoque() {
    const el = document.getElementById("estoque");
    if (el) el.style.border = "2px solid #045cac";
}

function saida() {
    const el = document.getElementById("saida");
    if (el) el.style.border = "2px solid #045cac";
}

// ===== ALERTA DE CONTA CRIADA COM SUCESSO =====
function a() {
    Swal.fire({
        title: "CONTA CRIADA COM SUCESSO",
        icon: "success",
        draggable: true
    });
}

// ===== LÓGICA DA TELA DE LOGIN =====
document.addEventListener('DOMContentLoaded', function () {
    const checkUser = document.getElementById('checkUser');
    const checkAdm = document.getElementById('checkAdm');
    const linkCriar = document.getElementById('linkCriar');
    const inputUser = document.getElementById('login');
    const inputSenha = document.getElementById('senha');

    if (!checkUser || !checkAdm || !linkCriar || !inputUser || !inputSenha) {
        return; 
    }

    function bloquearLink() {
        linkCriar.style.pointerEvents = 'none';
        linkCriar.style.opacity = '0.4';
        linkCriar.style.cursor = 'not-allowed';
    }

    function validarCredenciaisAdm() {
        if (!checkAdm.checked || !inputUser.value.trim() || !inputSenha.value.trim()) {
            bloquearLink();
            return;
        }

        fetch('/api/checar_adm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: inputUser.value.trim(),
                senha: inputSenha.value.trim()
            })
        })
        .then(r => r.json())
        .then(data => {
            if (data.valido) {
                linkCriar.style.pointerEvents = 'auto';
                linkCriar.style.opacity = '1';
                linkCriar.style.cursor = 'pointer';
            } else {
                bloquearLink();
            }
        })
        .catch(err => {
            console.error("Erro ao conectar com o servidor:", err);
            bloquearLink();
        });
    }

    checkUser.addEventListener('change', function () {
        if (this.checked) {
            checkAdm.checked = false;
            bloquearLink();
        }
    });

    checkAdm.addEventListener('change', function () {
        if (this.checked) {
            checkUser.checked = false;
            validarCredenciaisAdm(); 
        }
    });

    inputUser.addEventListener('input', validarCredenciaisAdm);
    inputSenha.addEventListener('input', validarCredenciaisAdm);

    bloquearLink();
});

// ===== PREVIEW DA IMAGEM AO ADICIONAR ITEM =====
function mostrarPreview(input) {
    const nome = input.files[0] ? input.files[0].name : '';
    const elemNome = document.getElementById('nomeArquivo');
    if (elemNome) elemNome.textContent = nome ? '📎 ' + nome : '';

    if (input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            const preview = document.getElementById('previewImagem');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ===== ALTERAR ITEM DO ESTOQUE =====
function abrirAlterar() {
    Swal.fire({
        title: 'Digite o ID do item',
        input: 'number',
        inputPlaceholder: 'Ex: 1',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        confirmButtonText: 'Buscar',
        confirmButtonColor: '#045cac'
    }).then(result => {
        if (!result.isConfirmed || !result.value) return;

        const id = result.value;

        fetch(`/api/item_completo/${id}`)
            .then(r => r.json())
            .then(data => {
                if (!data.nome) {
                    Swal.fire({ icon: 'error', title: 'Item não encontrado!' });
                    return;
                }

                document.getElementById('campo_nome').value = data.nome;
                document.getElementById('campo_categoria').value = data.categoria;
                document.getElementById('campo_descricao').value = data.descricao;
                document.getElementById('campo_preco').value = data.preco;
                document.getElementById('campo_quantidade').value = data.quantidade;
                document.getElementById('campo_estoqueminimo').value = data.estoque_min;

                document.getElementById('tituloPagina').textContent = 'ALTERAR ITEM';
                document.getElementById('formItem').action = `/api/alteraritem/${id}`;
                document.getElementById('btnAdicionar').innerHTML = '<strong>SALVAR</strong>';

                Swal.fire({ icon: 'success', title: `Item "${data.nome}" carregado!`, timer: 1500, showConfirmButton: false });
            })
            .catch(() => Swal.fire({ icon: 'error', title: 'Erro ao buscar item!' }));
    });
}

// ===== ADICIONAR ITEM NA TABELA DE SAÍDAS =====
function adicionarNaTabela() {
    const id_item = document.getElementById('id_item').value.trim();
    const qtde = document.getElementById('qtde').value.trim();

    if (!id_item || !qtde) {
        Swal.fire({ icon: 'warning', title: 'Preencha o ID e a QTDE!' });
        return;
    }

    const checkboxSim = document.getElementById('sim');
    const exigeDevolucao = (checkboxSim && checkboxSim.checked) ? 'Sim' : 'Não';

    fetch(`/api/item/${id_item}`)
        .then(r => r.json())
        .then(data => {
            if (!data.nome) {
                Swal.fire({ icon: 'error', title: 'Item não encontrado!' });
                return;
            }

            const tbody = document.getElementById('corpoTabela');
            const idx = tbody.rows.length;
            const tr = document.createElement('tr');
            tr.id = `linha-${idx}`;
            
            tr.innerHTML = `
                <td>${id_item}</td>
                <td>${data.nome}</td>
                <td>${qtde}</td>
                <td><strong>${exigeDevolucao}</strong></td>
                <td class="col-remover">
                    <button class="btn-remover" onclick="removerLinha('linha-${idx}')">✕</button>
                </td>
            `;
            tbody.appendChild(tr);

            document.getElementById('id_item').value = '';
            document.getElementById('qtde').value = '';
        })
        .catch(() => Swal.fire({ icon: 'error', title: 'Erro ao buscar item!' }));
}

// ===== LÓGICA DOS CHECKBOXES DE DEVOLUÇÃO =====
document.addEventListener('DOMContentLoaded', function () {
    const sim = document.getElementById('sim');
    const nao = document.getElementById('nao');

    if (sim && nao) {
        sim.addEventListener('change', function () {
            if (this.checked) nao.checked = false;
        });

        nao.addEventListener('change', function () {
            if (this.checked) sim.checked = false;
        });
    }
});

// ===== REGISTRAR SAÍDA =====
function registrarSaida() {
    const tbody = document.getElementById('corpoTabela');
    if (!tbody) return;
    const linhas = tbody.querySelectorAll('tr');

    if (linhas.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Adicione pelo menos um item!' });
        return;
    }

    const itens = [];
    linhas.forEach(tr => {
        const cells = tr.querySelectorAll('td');
        itens.push({
            id: cells[0].textContent.trim(),
            nome: cells[1].textContent.trim(),
            qtde: cells[2].textContent.trim(),
            devolucao: cells[3].textContent.trim() 
        });
    });

    const solicitante = document.getElementById('solicitante') ? document.getElementById('solicitante').value.trim() : '';
    const almoxarife = document.getElementById('almoxarife') ? document.getElementById('almoxarife').value.trim() : '';
    const campoData = document.getElementById('data') || document.getElementById('data_retirada');
    const data = campoData ? campoData.value : null;
    const campoObs = document.getElementById('obs') || document.getElementById('finalidade');
    const obs = campoObs ? campoObs.value.trim() : '';

    fetch('/api/registrarsaida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitante, almoxarife, data, obs, itens })
    })
    .then(r => r.json())
    .then(resp => {
        if (resp.ok) {
            Swal.fire({ icon: 'success', title: 'Saída registrada com sucesso!' }).then(() => {
                tbody.innerHTML = '';
                sessionStorage.clear();
                window.location.reload();
            });
        } else {
            Swal.fire({ icon: 'error', title: 'Erro ao registrar!', text: resp.erro || '' });
        }
    })
    .catch(err => {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Erro de conexão com o servidor!' });
    });
}

// ===== MARCAR DEVOLUÇÃO NO HISTÓRICO =====
function marcarDevolucao(btn, tipo) {
    const td = btn.parentElement;        
    const tr = td.parentElement;        
    const saida_id = tr.dataset.id;      
    const cells = tr.querySelectorAll('td');
    const nomeItem = cells[0].textContent.trim();   
    const qtdeSaida = parseInt(cells[1].textContent.trim()); 

    if (tipo === 'parcial') {
        Swal.fire({
            title: 'Quantos foram devolvidos?',
            input: 'number',
            inputPlaceholder: 'Ex: 1',
            showCancelButton: true,
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Confirmar',
            confirmButtonColor: '#045cac'
        }).then(result => {
            if (result.isConfirmed && result.value) {
                const qtdeDevolvida = parseInt(result.value);

                fetch('/api/devolucao', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome: nomeItem, qtde: qtdeDevolvida, status: 'parcial', saida_id: saida_id })
                }).then(r => r.json()).then(resp => {
                    if (resp.ok) {
                        cells[1].textContent = qtdeSaida - qtdeDevolvida;
                        td.innerHTML = '<span style="color:#F28B0C; font-weight:bold;">Parcial (' + qtdeDevolvida + ')</span>';
                    }
                });
            }
        });
    } else {
        fetch('/api/devolucao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: nomeItem, qtde: qtdeSaida, status: 'total', saida_id: saida_id })
        }).then(r => r.json()).then(resp => {
            if (resp.ok) {
                cells[1].textContent = 0;
                td.innerHTML = '<span style="color:#045cac; font-weight:bold;">Total</span>';
            }
        });
    }
}

function importarCSV(input) {
    const formData = new FormData();
    formData.append('arquivo', input.files[0]);

    fetch('/api/importarcsv', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(resp => {
            if (resp.ok) {
                Swal.fire({ icon: 'success', title: `${resp.total} itens importados com sucesso!` })
                    .then(() => window.location.href = '/estoque');
            } else {
                Swal.fire({ icon: 'error', title: 'Erro na importação', text: resp.erro });
            }
        });
}

function exportarCSV() {
    window.location.href = '/api/exportarcsv';
}

// ===== PESQUISA NA TABELA =====
document.addEventListener("DOMContentLoaded", function() {
    const inputPesquisa = document.getElementById('pesquisa');
    
    if (inputPesquisa) {
        const linhasTabela = document.querySelectorAll('table tbody tr');

        inputPesquisa.addEventListener('input', function() {
            const termoBusca = inputPesquisa.value.toLowerCase().trim();

            linhasTabela.forEach(linha => {
                const textoLinha = linha.textContent.toLowerCase();
                if (textoLinha.includes(termoBusca)) {
                    linha.style.display = ''; 
                } else {
                    linha.style.display = 'none';
                }
            });
        });
    }
});

// ===== CHAT COM IA (VERSÃO UNIVERSAL BLINDADA) =====
function toggleChat() {
    const chat = document.getElementById('chatContainer');
    if (chat) {
        chat.style.display = chat.style.display === 'flex' ? 'none' : 'flex';
    }
}

async function enviarMensagem() {
    const input = document.getElementById('chatInput');
    const body = document.getElementById('chatBody');
    if (!input || !body || input.value.trim() === '') return;

    const textoUsuario = input.value.trim();

    // Mostra a mensagem do utilizador no chat
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = textoUsuario;
    body.appendChild(userMsg);

    input.value = '';
    body.scrollTop = body.scrollHeight;

    // Indicador de "A analisar..."
    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'chat-message ai';
    loadingMsg.textContent = "A analisar...";
    body.appendChild(loadingMsg);
    body.scrollTop = body.scrollHeight;

    try {
        // Busca os dados do stock no Flask
        let dadosEstoqueRes = await fetch('/api/estoque');
        let dadosEstoqueJson = await dadosEstoqueRes.json();
        let resumoEstoque = dadosEstoqueJson.sucesso ? JSON.stringify(dadosEstoqueJson.estoque) : "[]";

        // Prompt direto e objetivo com o stock atual
        const promptSistema = `És um assistente de almoxarifado. O inventário atual do stock é: ${resumoEstoque}. Responde de forma clara em Português do Brasil. Se o utilizador quiser adicionar um item, deves extrair o nome, quantidade, preço e descrição (se mencionada). Responde exatamente com o formato JSON de comando: COMANDO_ADICIONAR: {"nome": "NOME", "quantidade": NUMERO, "preco": PRECO, "descricao": "TEXTO_DESCRICAO"}`;
        const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "openai/gpt-oss-120b", // Modelo atualizado conforme o painel da Groq
                messages: [
                    { role: "system", content: promptSistema },
                    { role: "user", content: textoUsuario }
                ],
                temperature: 1,
                max_completion_tokens: 2048
            })
        });

        const dados = await resposta.json();
        body.removeChild(loadingMsg);

        // Se a API retornar erro interno, mostra no chat para sabermos o motivo exato
        if (dados.error) {
            console.error("Erro retornado pela API Groq:", dados.error);
            const erroMsg = document.createElement('div');
            erroMsg.className = 'chat-message ai';
            erroMsg.textContent = "Erro da IA: " + (dados.error.message || "Erro desconhecido");
            body.appendChild(erroMsg);
            return;
        }

        if (dados.choices && dados.choices.length > 0) {
            const respostaTexto = dados.choices[0].message.content;

            if (respostaTexto.includes("COMANDO_ADICIONAR:")) {
                try {
                    const jsonString = respostaTexto.split("COMANDO_ADICIONAR:")[1].trim();
                    const objItem = JSON.parse(jsonString);

                    const addRes = await fetch('/api/adicionarestoque', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(objItem)
                    });
                    const addJson = await addRes.json();

                    const aiMsg = document.createElement('div');
                    aiMsg.className = 'chat-message ai';
                    if (addJson.sucesso) {
                        aiMsg.textContent = `Item "${objItem.nome}" adicionado com sucesso ao stock!`;
                        setTimeout(() => window.location.reload(), 2000);
                    } else {
                        aiMsg.textContent = `Erro ao adicionar: ${addJson.erro}`;
                    }
                    body.appendChild(aiMsg);
                } catch (e) {
                    const aiMsg = document.createElement('div');
                    aiMsg.className = 'chat-message ai';
                    aiMsg.textContent = "Erro ao interpretar os dados para adicionar o item.";
                    body.appendChild(aiMsg);
                }
            } else {
                const aiMsg = document.createElement('div');
                aiMsg.className = 'chat-message ai';
                aiMsg.textContent = respostaTexto;
                body.appendChild(aiMsg);
            }
        } else {
            const erroMsg = document.createElement('div');
            erroMsg.className = 'chat-message ai';
            erroMsg.textContent = "Desculpe, não consegui processar a resposta.";
            body.appendChild(erroMsg);
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
        if (document.body.contains(loadingMsg)) body.removeChild(loadingMsg);

        const erroMsg = document.createElement('div');
        erroMsg.className = 'chat-message ai';
        erroMsg.textContent = "Erro de conexão com o servidor da IA.";
        body.appendChild(erroMsg);
    }

    body.scrollTop = body.scrollHeight;
}

function verificarEnter(e) {
    if (e.key === 'Enter') {
        enviarMensagem();
    }
}