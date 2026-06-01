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
    const senhaCorreta = inputSenha.value === 'senai2026';
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

    const solicitante = document.getElementById('solicitante').value.trim();
    const almoxarife  = document.getElementById('almoxarife').value.trim();
    const data        = document.getElementById('data').value;
    const obs         = document.getElementById('obs').value.trim();
    const devolucao   = document.getElementById('sim').checked ? 'Sim' : 'Não';

    fetch('/api/registrarsaida', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ solicitante, almoxarife, data, obs, devolucao, itens })
    })
    .then(r => r.json())
    .then(resp => {
        if (resp.ok) {
            Swal.fire({ icon: 'success', title: 'Saída registrada!' }).then(() => {
                tbody.innerHTML = '';
            });
        } else {
            Swal.fire({ icon: 'error', title: 'Erro ao registrar!' });
        }
    })
    .catch(() => Swal.fire({ icon: 'error', title: 'Erro de conexão!' }));
}