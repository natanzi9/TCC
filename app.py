import os
import bcrypt
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import mysql.connector

app = Flask(__name__)
app.secret_key = "senha_super_secreta"
app.config['UPLOAD_FOLDER'] = 'static/uploads'
os.makedirs('static/uploads', exist_ok=True)


def banco():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="tcc"
    )


@app.route('/')
def login():
    return render_template("index.html")


@app.route('/home')
def home():
    conexao = banco()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT nome, quantidade, imagem FROM estoque ORDER BY id DESC")
    ultimos = cursor.fetchall()
    cursor.execute("SELECT item, qtde, data, solicitante, almoxarife, descricao FROM saidas ORDER BY id DESC")
    saidas = cursor.fetchall()
    cursor.close()
    conexao.close()
    return render_template("home.html", ultimos=ultimos, saidas=saidas)


@app.route('/adicionaritens')
def adicionaritens():
    return render_template("adicionaritens.html")


@app.route('/estoque')
def estoque():
    conexao = banco()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT * FROM estoque")
    itens = cursor.fetchall()
    cursor.close()
    conexao.close()
    return render_template("estoque.html", itens=itens)


@app.route('/saidas')
def saidas():
    return render_template("saidas.html")


@app.route('/criarconta')
def criarconta():
    return render_template("criarconta.html")


# ========== LOGIN ==========
@app.route('/api/login', methods=['POST'])
def apilogin():
    username = request.form['username']
    senha    = request.form['senha']
    tipo     = request.form.get('tipo', '')

    # Se marcou ADM: só entra com administrador/senai2026
    if tipo == 'adm':
        if username.lower() == 'admin' and senha == '123':
            session['usuario'] = username
            session['tipo']    = 'adm'
            return redirect(url_for('home'))
        else:
            return """
            <script>
                alert("Credenciais de administrador incorretas");
                window.location.href = "/";
            </script>
            """

    # Se marcou USER: não pode entrar como administrador
    if tipo == 'user':
        if username.lower() == 'admin':
            return """
        <script>
            alert("Use o tipo ADM para entrar como administrador");
            window.location.href = "/";
        </script>
        """
    conexao = banco()
    cursor  = conexao.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM usuario WHERE usuario = %s",
        (username,)
    )
    usuario = cursor.fetchone()
    cursor.close()
    conexao.close()

    if usuario and bcrypt.checkpw(senha.encode('utf-8'), usuario['senha'].encode('utf-8')):
        session['usuario'] = username
        session['tipo']    = 'user'
        return redirect(url_for('home'))
    else:
        return """
        <script>
            alert("Usuário ou senha incorretos");
            window.location.href = "/";
        </script>
        """
# ========== CRIAR CONTA ==========
@app.route('/api/criarconta', methods=['POST'])
def api_criarconta():
    username  = request.form['username']
    senha     = request.form['senha']
    confirmar = request.form['confirmar']

    if senha != confirmar:
        return """
        <script>
            alert("As senhas não coincidem");
            window.location.href = "/criarconta";
        </script>
        """

    conexao = banco()
    cursor  = conexao.cursor(dictionary=True)
    cursor.execute("SELECT id FROM usuario WHERE usuario = %s", (username,))
    existente = cursor.fetchone()

    if existente:
        cursor.close()
        conexao.close()
        return """
        <script>
            alert("Usuário já cadastrado!");
            window.location.href = "/criarconta";
        </script>
        """

    # Gera o hash da senha
    hash_senha = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    cursor2 = conexao.cursor()
    cursor2.execute(
        "INSERT INTO usuario (usuario, senha) VALUES (%s, %s)",
        (username, hash_senha)
    )
    conexao.commit()
    cursor2.close()
    cursor.close()
    conexao.close()

    return """
    <script>
        alert("Conta criada com sucesso!");
        window.location.href = "/";
    </script>
    """


# ========== ADICIONAR ITEM COM IMAGEM ==========
@app.route('/api/adicionaritem', methods=['POST'])
def adicionaritem():
    nome         = request.form['nome']
    categoria    = request.form['categoria']
    descricao    = request.form['descricao']
    preco        = request.form['preco']
    quantidade   = request.form['quantidade']
    estoqueminimo = request.form['estoqueminimo']

    imagem = request.files.get('imagem')
    caminho_imagem = None
    if imagem and imagem.filename != '':
        caminho_imagem = imagem.filename
        imagem.save(os.path.join(app.config['UPLOAD_FOLDER'], imagem.filename))

    conexao = banco()
    cursor = conexao.cursor()
    cursor.execute(
        """INSERT INTO estoque (nome, categoria, descricao, preco, quantidade, estoque_min, imagem)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (nome, categoria, descricao, preco, quantidade, estoqueminimo, caminho_imagem)
    )
    conexao.commit()
    cursor.close()
    conexao.close()

    return """
    <script>
        alert("Item adicionado com sucesso!");
        window.location.href = "/estoque";
    </script>
    """


# ========== BUSCAR ITEM POR ID (saídas) ==========
@app.route('/api/item/<int:id>')
def api_item(id):
    conexao = banco()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT nome FROM estoque WHERE id = %s", (id,))
    item = cursor.fetchone()
    cursor.close()
    conexao.close()
    return jsonify(item if item else {})


# ========== REGISTRAR SAÍDA ==========
@app.route('/api/registrarsaida', methods=['POST'])
def api_registrarsaida():
    dados     = request.get_json()
    itens     = dados.get('itens', [])
    obs       = dados.get('obs')
    devolucao = dados.get('devolucao')

    conexao = banco()
    cursor  = conexao.cursor()

    try:
        for item in itens:
            cursor.execute(
                """INSERT INTO saidas (item, qtde, descricao, categoria, solicitante, almoxarife, data, devolucao)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    item['nome'],
                    item['qtde'],
                    obs,
                    devolucao,
                    dados.get('solicitante'),
                    dados.get('almoxarife'),
                    dados.get('data') or None,
                    devolucao
                )
            )
            cursor.execute(
                "UPDATE estoque SET quantidade = quantidade - %s WHERE id = %s",
                (item['qtde'], item['id'])
            )
            cursor.execute("SELECT nome, quantidade, imagem FROM estoque ORDER BY id DESC")
        conexao.commit()  # ← estava faltando isso
        return jsonify({'ok': True})

    except Exception as e:
        conexao.rollback()
        print("ERRO:", e)
        return jsonify({'ok': False, 'erro': str(e)}), 500

    finally:
        cursor.close()
        conexao.close()

@app.route('/api/item_completo/<int:id>')
def api_item_completo(id):
    conexao = banco()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT * FROM estoque WHERE id = %s", (id,))
    item = cursor.fetchone()
    cursor.close()
    conexao.close()
    return jsonify(item if item else {})


# ========== ALTERAR ITEM ==========
@app.route('/api/alteraritem/<int:id>', methods=['POST'])
def alteraritem(id):
    nome          = request.form['nome']
    categoria     = request.form['categoria']
    descricao     = request.form['descricao']
    preco         = request.form['preco']
    quantidade    = request.form['quantidade']
    estoqueminimo = request.form['estoqueminimo']

    imagem = request.files.get('imagem')
    conexao = banco()
    cursor = conexao.cursor()

    if imagem and imagem.filename != '':
        caminho_imagem = imagem.filename
        imagem.save(os.path.join(app.config['UPLOAD_FOLDER'], imagem.filename))
        cursor.execute(
            """UPDATE estoque SET nome=%s, categoria=%s, descricao=%s,
               preco=%s, quantidade=%s, estoque_min=%s, imagem=%s
               WHERE id=%s""",
            (nome, categoria, descricao, preco, quantidade, estoqueminimo, caminho_imagem, id)
        )
    else:
        cursor.execute(
            """UPDATE estoque SET nome=%s, categoria=%s, descricao=%s,
               preco=%s, quantidade=%s, estoque_min=%s
               WHERE id=%s""",
            (nome, categoria, descricao, preco, quantidade, estoqueminimo, id)
        )

    conexao.commit()
    cursor.close()
    conexao.close()

    return """
    <script>
        alert("Item alterado com sucesso!");
        window.location.href = "/estoque";
    </script>
    """


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')