function a() {
    Swal.fire({
        title: "CONTA CRIADA COM SUCESSO",
        icon: "success",
        draggable: true
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const checkUser  = document.getElementById('checkUser');
    const checkAdm   = document.getElementById('checkAdm');
    const linkCriar  = document.getElementById('linkCriar');
    const inputLogin = document.getElementById('login');
    const inputSenha = document.getElementById('senha');

    if (!checkUser || !linkCriar) return;

    function verificar() {
        const loginCorreto = inputLogin.value.toLowerCase() === 'administrador';
        const senhaCorreta = inputSenha.value === 'senai2026';
        const isAdm = checkAdm.checked;

        const podeCriar = isAdm && loginCorreto && senhaCorreta;

        if (podeCriar) {
            linkCriar.style.pointerEvents = 'auto';
            linkCriar.style.opacity = '1';
            linkCriar.style.cursor = 'pointer';
        } else {
            linkCriar.style.pointerEvents = 'none';
            linkCriar.style.opacity = '0.4';
            linkCriar.style.cursor = 'not-allowed';
        }
    }

    checkUser.addEventListener('change', function() {
        if (this.checked) checkAdm.checked = false;
        verificar();
    });

    checkAdm.addEventListener('change', function() {
        if (this.checked) checkUser.checked = false;
        verificar();
    });

    inputLogin.addEventListener('input', verificar);
    inputSenha.addEventListener('input', verificar);

    verificar();
});