function colorir() {
    document.getElementById("home").style.border = "2px solid #045cac";
}

function coloriraditens() {
    document.getElementById("itens").style.border = "2px solid #045cac";
}

function colorirestoque() {
    document.getElementById("estoque").style.border = "2px solid #045cac";
}

function saida() {
    document.getElementById("saida").style.border = "2px solid #045cac";
}

function a() {
    Swal.fire({
        title: "CONTA CRIADA COM SUCESSO",
        icon: "success",
        draggable: true
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const checkUser  = document.getElementById('checkUser');
    const checkAdm   = document.getElementById('checkAdm');
    const linkCriar  = document.getElementById('linkCriar');
    const inputLogin = document.getElementById('login');
    const inputSenha = document.getElementById('senha');

   function verificar() {
    const loginCorreto = inputLogin.value.toLowerCase() === 'admin';
    const senhaCorreta = inputSenha.value === '123';
    const isAdm        = checkAdm.checked;
    const isUser       = checkUser.checked;

    // adm: precisa marcar ADM + login e senha corretos
    // user: precisa marcar USER + login NÃO pode ser administrador
    const podeEntrar =
        (isAdm && loginCorreto && senhaCorreta) ||
        (isUser && !loginCorreto);

    // libera o link de criar conta só se for adm com credenciais certas
    const podeCriar = isAdm && loginCorreto && senhaCorreta;

    if (podeCriar) {
        linkCriar.style.pointerEvents = 'auto';
        linkCriar.style.opacity       = '1';
        linkCriar.style.cursor        = 'pointer';
    } else {
        linkCriar.style.pointerEvents = 'none';
        linkCriar.style.opacity       = '0.4';
        linkCriar.style.cursor        = 'not-allowed';
    }
}

    checkUser.addEventListener('change', function () {
        if (this.checked) checkAdm.checked = false;
        verificar();
    });

    checkAdm.addEventListener('change', function () {
        if (this.checked) checkUser.checked = false;
        verificar();
    });

    inputLogin.addEventListener('input', verificar);
    inputSenha.addEventListener('input', verificar);

    verificar();
});

function mostrarPreview(input) {
    const nome = input.files[0] ? input.files[0].name : '';
    document.getElementById('nomeArquivo').textContent = nome ? '📎 ' + nome : '';

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

                document.getElementById('campo_nome').value          = data.nome;
                document.getElementById('campo_categoria').value     = data.categoria;
                document.getElementById('campo_descricao').value     = data.descricao;
                document.getElementById('campo_preco').value         = data.preco;
                document.getElementById('campo_quantidade').value    = data.quantidade;
                document.getElementById('campo_estoqueminimo').value = data.estoque_min;

                document.getElementById('tituloPagina').textContent  = 'ALTERAR ITEM';
                document.getElementById('formItem').action           = `/api/alteraritem/${id}`;
                document.getElementById('btnAdicionar').innerHTML    = '<strong>SALVAR</strong>';

                Swal.fire({ icon: 'success', title: `Item "${data.nome}" carregado!`, timer: 1500, showConfirmButton: false });
            })
            .catch(() => Swal.fire({ icon: 'error', title: 'Erro ao buscar item!' }));
    });
}

function adicionarNaTabela() {
    const id_item = document.getElementById('id_item').value.trim();
    const qtde    = document.getElementById('qtde').value.trim();

    if (!id_item || !qtde) {
        Swal.fire({ icon: 'warning', title: 'Preencha o ID e a QTDE!' });
        return;
    }

    fetch(`/api/item/${id_item}`)
        .then(r => r.json())
        .then(data => {
            if (!data.nome) {
                Swal.fire({ icon: 'error', title: 'Item não encontrado!' });
                return;
            }

            const tbody = document.getElementById('corpoTabela');
            const idx   = tbody.rows.length;
            const tr    = document.createElement('tr');
            tr.id       = `linha-${idx}`;
            tr.innerHTML = `
                <td>${id_item}</td>
                <td>${data.nome}</td>
                <td>${qtde}</td>
                <td class="col-remover">
                    <button class="btn-remover" onclick="removerLinha('linha-${idx}')">✕</button>
                </td>
            `;
            tbody.appendChild(tr);

            document.getElementById('id_item').value = '';
            document.getElementById('qtde').value    = '';
        })
        .catch(() => Swal.fire({ icon: 'error', title: 'Erro ao buscar item!' }));
}

function removerLinha(id) {
    const tr = document.getElementById(id);
    if (tr) tr.remove();
}

function registrarSaida() {
    const tbody  = document.getElementById('corpoTabela');
    const linhas = tbody.querySelectorAll('tr');

    if (linhas.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Adicione pelo menos um item!' });
        return;
    }

    const itens = [];
    linhas.forEach(tr => {
        const cells = tr.querySelectorAll('td');
        itens.push({
            id:   cells[0].textContent.trim(),
            nome: cells[1].textContent.trim(),
            qtde: cells[2].textContent.trim()
        });
    });

    // --- CORREÇÃO DOS CAMPOS CONFORME O SEU PRINT ---
    const solicitante = document.getElementById('solicitante') ? document.getElementById('solicitante').value.trim() : '';
    const almoxarife  = document.getElementById('almoxarife') ? document.getElementById('almoxarife').value.trim() : '';
    
    // ATENÇÃO: Verifique se o ID no HTML da data é 'data' ou 'data_retirada'
    const campoData = document.getElementById('data') || document.getElementById('data_retirada');
    const data = campoData ? campoData.value : null;
    
    // ATENÇÃO: No print está "Finalidade". Verifique se o ID no seu HTML é 'obs' ou 'finalidade'
    const campoObs = document.getElementById('obs') || document.getElementById('finalidade');
    const obs = campoObs ? campoObs.value.trim() : '';

    // --- CORREÇÃO DO SIM / NÃO ---
    // Procura pelo ID 'sim'. Se não achar, tenta achar pelo name ou assume 'Não'
    const checkboxSim = document.getElementById('sim');
    const devolucao = (checkboxSim && checkboxSim.checked) ? 'Sim' : 'Não';

    // Monta o objeto exatamente como a sua API Python espera receber
    const dadosParaEnviar = { 
        solicitante: solicitante, 
        almoxarife: almoxarife, 
        data: data, 
        obs: obs,            // Python espera 'obs'
        devolucao: devolucao // Python espera 'devolucao'
    };

    fetch('/api/registrarsaida', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ 
            solicitante: solicitante, 
            almoxarife: almoxarife, 
            data: data, 
            obs: obs, 
            devolucao: devolucao, 
            itens: itens 
        })
    })
    .then(r => r.json())
    .then(resp => {
        if (resp.ok) {
            Swal.fire({ icon: 'success', title: 'Saída registrada com sucesso!' }).then(() => {
                tbody.innerHTML = '';
                // Opcional: Se usou o sessionStorage para salvar os campos, limpa aqui:
                sessionStorage.clear(); 
                window.location.reload(); // Recarrega para limpar os campos da tela
            });
        } else {
            // Mostra o erro exato que o Python devolveu (ajuda muito a descobrir se falta coluna no banco)
            Swal.fire({ icon: 'error', title: 'Erro ao registrar!', text: resp.erro || '' });
        }
    })
    .catch(err => {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Erro de conexão com o servidor!' });
    });
}