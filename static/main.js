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
