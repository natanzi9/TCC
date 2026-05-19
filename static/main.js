function a() {
    Swal.fire({
        title: "CONTA CRIADA COM SUCESSO",
        icon: "success",
        draggable: true
    });
}
function colorir() {
    document.getElementById("home").style.border = "2px solid #045cac";
}
function coloriraditens() {
    document.getElementById("home").style.border = "2px solid #fdfdfd";
    document.getElementById("itens").style.border = "2px solid #045cac";
}
function colorirestoque() {
    document.getElementById("home").style.border = "2px solid #fdfdfd";
    document.getElementById("itens").style.border = "2px solid #fdfdfd";
    document.getElementById("estoque").style.border = "2px solid #045cac";
}
function saida() {
    document.getElementById("home").style.border = "2px solid #fdfdfd";
    document.getElementById("itens").style.border = "2px solid #fdfdfd";
    document.getElementById("estoque").style.border = "2px solid #fdfdfd";
    document.getElementById("saida").style.border = "2px solid #045cac";
}
document.addEventListener('DOMContentLoaded', function() {

    const checkUser  = document.getElementById('checkUser');
    const checkAdm   = document.getElementById('checkAdm');
    const linkCriar  = document.getElementById('linkCriar');
    const inputLogin = document.getElementById('login');
    const inputSenha = document.getElementById('senha');

    if (!checkUser) return;

    checkUser.addEventListener('change', function() {
        if (this.checked) checkAdm.checked = false;
        verificar();
    });

    checkAdm.addEventListener('change', function() {
        if (this.checked) checkUser.checked = false;
        verificar();
    });

    function verificar() {
        const loginPreenchido = inputLogin.value.trim() !== '';
        const senhaPreenchida = inputSenha.value.trim() !== '';
        const isAdm = checkAdm.checked;
        const isUser = checkUser.checked;

        // Se for USER bloqueia sempre
        if (isUser) {
            linkCriar.style.pointerEvents = 'none';
            linkCriar.style.opacity = '0.4';
            linkCriar.style.color = '#F28B0C';
        }
        // Se for ADM só libera se tiver login e senha preenchidos
        else if (isAdm && loginPreenchido && senhaPreenchida) {
            linkCriar.style.pointerEvents = 'auto';
            linkCriar.style.opacity = '1';
            linkCriar.style.color = '#F28B0C';
        } else {
            linkCriar.style.pointerEvents = 'none';
            linkCriar.style.opacity = '0.4';
            linkCriar.style.color = '#F28B0C';
        }
    }

    inputLogin.addEventListener('input', verificar);
    inputSenha.addEventListener('input', verificar);

    verificar();
});
