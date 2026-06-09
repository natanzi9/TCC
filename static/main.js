// ===== DESTACA O BOTÃO DA PÁGINA ATUAL NA NAVBAR =====
function colorir() {
    // Borda azul no botão HOME quando está na página home
    document.getElementById("home").style.border = "2px solid #045cac";
}

function coloriraditens() {
    // Borda azul no botão ADICIONAR ITENS quando está nessa página
    document.getElementById("itens").style.border = "2px solid #045cac";
}

function colorirestoque() {
    // Borda azul no botão ESTOQUE quando está nessa página
    document.getElementById("estoque").style.border = "2px solid #045cac";
}

function saida() {
    // Borda azul no botão REGISTRAR SAÍDAS quando está nessa página
    document.getElementById("saida").style.border = "2px solid #045cac";
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
    
    // Ajustado para o ID correto do seu HTML: 'login'
    const inputUser = document.getElementById('login');
    const inputSenha = document.getElementById('senha');

    // Se não achar os elementos, avisa no F12 para ajudar no teste
    if (!checkUser || !checkAdm || !linkCriar || !inputUser || !inputSenha) {
        console.error("ERRO: Elementos do formulário não foram encontrados. Verifique os IDs no HTML.");
        return;
    }

    function bloquearLink() {
        linkCriar.style.pointerEvents = 'none';
        linkCriar.style.opacity = '0.4';
        linkCriar.style.cursor = 'not-allowed';
    }

    function validarCredenciaisAdm() {
        // Se a caixinha ADM não estiver marcada ou faltar digitar algo, bloqueia o link
        if (!checkAdm.checked || !inputUser.value.trim() || !inputSenha.value.trim()) {
            bloquearLink();
            return;
        }

        // Faz a checagem em tempo real lá no Python
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
                // Se a senha e usuário do admin estiverem certos, libera o link!
                linkCriar.style.styleWithCSS = true;
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

    // Regra dos Checkboxes (Desmarca um quando o outro é marcado)
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

    // Monitora o teclado enquanto o administrador digita
    inputUser.addEventListener('input', validarCredenciaisAdm);
    inputSenha.addEventListener('input', validarCredenciaisAdm);

    // Inicializa a página com o link bloqueado
    bloquearLink();
});

// ===== PREVIEW DA IMAGEM AO ADICIONAR ITEM =====
function mostrarPreview(input) {
    // Mostra o nome do arquivo selecionado
    const nome = input.files[0] ? input.files[0].name : '';
    document.getElementById('nomeArquivo').textContent = nome ? '📎 ' + nome : '';

    // Mostra a prévia da imagem selecionada
    if (input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            const preview = document.getElementById('previewImagem');
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ===== ALTERAR ITEM DO ESTOQUE =====
function abrirAlterar() {
    // Abre um popup pedindo o ID do item que quer alterar
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

        // Busca os dados do item no servidor pelo ID
        fetch(`/api/item_completo/${id}`)
            .then(r => r.json())
            .then(data => {
                if (!data.nome) {
                    Swal.fire({ icon: 'error', title: 'Item não encontrado!' });
                    return;
                }

                // Preenche o formulário com os dados do item encontrado
                document.getElementById('campo_nome').value = data.nome;
                document.getElementById('campo_categoria').value = data.categoria;
                document.getElementById('campo_descricao').value = data.descricao;
                document.getElementById('campo_preco').value = data.preco;
                document.getElementById('campo_quantidade').value = data.quantidade;
                document.getElementById('campo_estoqueminimo').value = data.estoque_min;

                // Muda o título e o botão para indicar que está alterando
                document.getElementById('tituloPagina').textContent = 'ALTERAR ITEM';
                document.getElementById('formItem').action = `/api/alteraritem/${id}`;
                document.getElementById('btnAdicionar').innerHTML = '<strong>SALVAR</strong>';

                Swal.fire({ icon: 'success', title: `Item "${data.nome}" carregado!`, timer: 1500, showConfirmButton: false });
            })
            .catch(() => Swal.fire({ icon: 'error', title: 'Erro ao buscar item!' }));
    });
}

// ===== ADICIONAR ITEM NA TABELA DE SAÍDAS =====
// ===== ADICIONAR ITEM NA TABELA DE SAÍDAS =====
function adicionarNaTabela() {
    const id_item = document.getElementById('id_item').value.trim();
    const qtde = document.getElementById('qtde').value.trim();

    // Valida se os campos de item e quantidade foram preenchidos
    if (!id_item || !qtde) {
        Swal.fire({ icon: 'warning', title: 'Preencha o ID e a QTDE!' });
        return;
    }

    // Pega qual checkbox de devolução está marcado no momento
    const checkboxSim = document.getElementById('sim');
    const exigeDevolucao = (checkboxSim && checkboxSim.checked) ? 'Sim' : 'Não';

    // Busca o nome do item pelo ID no servidor
    fetch(`/api/item/${id_item}`)
        .then(r => r.json())
        .then(data => {
            if (!data.nome) {
                Swal.fire({ icon: 'error', title: 'Item não encontrado!' });
                return;
            }

            // Adiciona uma nova linha na tabela de itens da saída
            const tbody = document.getElementById('corpoTabela');
            const idx = tbody.rows.length;
            const tr = document.createElement('tr');
            tr.id = `linha-${idx}`;
            
            // Injetamos o "Sim" ou "Não" na quarta coluna (td)
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

            // Limpa apenas os campos de adicionar itens após o sucesso
            document.getElementById('id_item').value = '';
            document.getElementById('qtde').value = '';
        })
        .catch(() => Swal.fire({ icon: 'error', title: 'Erro ao buscar item!' }));
}

// ===== LÓGICA DOS CHECKBOXES DE DEVOLUÇÃO (Roda ao carregar a página) =====
document.addEventListener('DOMContentLoaded', function () {
    const sim = document.getElementById('sim');
    const nao = document.getElementById('nao');

    // Se esses checkboxes existirem na página atual (tela de saídas)
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
    const linhas = tbody.querySelectorAll('tr');

    // Verifica se tem pelo menos um item na tabela
    if (linhas.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Adicione pelo menos um item!' });
        return;
    }

    // Monta a lista de itens a partir das linhas da tabela
    const itens = [];
    linhas.forEach(tr => {
        const cells = tr.querySelectorAll('td');
        itens.push({
            id: cells[0].textContent.trim(),
            nome: cells[1].textContent.trim(),
            qtde: cells[2].textContent.trim(),
            // NOVIDADE: Pega o "Sim" ou "Não" que está escrito NESTA linha específica da tabela
            devolucao: cells[3].textContent.trim() 
        });
    });

    // Pega os outros valores dos campos do formulário
    const solicitante = document.getElementById('solicitante') ? document.getElementById('solicitante').value.trim() : '';
    const almoxarife = document.getElementById('almoxarife') ? document.getElementById('almoxarife').value.trim() : '';
    const campoData = document.getElementById('data') || document.getElementById('data_retirada');
    const data = campoData ? campoData.value : null;
    const campoObs = document.getElementById('obs') || document.getElementById('finalidade');
    const obs = campoObs ? campoObs.value.trim() : '';

    // Envia todos os dados para o servidor registrar a saída
    fetch('/api/registrarsaida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitante, almoxarife, data, obs, itens }) // Removemos o 'devolucao' global daqui
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
    const td = btn.parentElement;        // célula onde estão os botões
    const tr = td.parentElement;         // linha da tabela
    const saida_id = tr.dataset.id;      // ID da saída salvo no data-id da linha
    const cells = tr.querySelectorAll('td');
    const nomeItem = cells[0].textContent.trim();   // nome do item
    const qtdeSaida = parseInt(cells[1].textContent.trim()); // quantidade que saiu

    if (tipo === 'parcial') {
        // Abre popup perguntando quantos foram devolvidos
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

                // Envia a devolução parcial para o servidor
                fetch('/api/devolucao', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome: nomeItem, qtde: qtdeDevolvida, status: 'parcial', saida_id: saida_id })
                }).then(r => r.json()).then(resp => {
                    if (resp.ok) {
                        // Atualiza a quantidade na tela e muda o texto da célula
                        cells[1].textContent = qtdeSaida - qtdeDevolvida;
                        td.innerHTML = '<span style="color:#F28B0C; font-weight:bold;">Parcial (' + qtdeDevolvida + ')</span>';
                    }
                });
            }
        });
    } else {
        // Devolução total: devolve tudo de uma vez
        fetch('/api/devolucao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: nomeItem, qtde: qtdeSaida, status: 'total', saida_id: saida_id })
        }).then(r => r.json()).then(resp => {
            if (resp.ok) {
                // Zera a quantidade na tela e muda o texto da célula
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