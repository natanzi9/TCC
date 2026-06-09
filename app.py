import csv
import io
import os
import bcrypt
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import mysql.connector

app = Flask(__name__)
app.secret_key = "senha_super_secreta"  # Chave para criptografar a sessão do usuário
app.config['UPLOAD_FOLDER'] = 'static/uploads'  # Pasta onde as imagens são salvas
os.makedirs('static/uploads', exist_ok=True)  # Cria a pasta se não existir


# ===== CONEXÃO COM O BANCO DE DADOS =====
def banco():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="tcc"
    )


# ===== PÁGINAS =====

@app.route('/')
def login():
    # Página inicial de login
    return render_template("index.html")


@app.route('/home')
def home():
    conexao = banco()
    cursor = conexao.cursor(dictionary=True)

    # Busca todos os itens do estoque, do mais recente para o mais antigo
    cursor.execute("SELECT nome, quantidade, imagem FROM estoque ORDER BY id DESC LIMIT 10")
    ultimos = cursor.fetchall()

    # Busca todas as saídas registradas, incluindo status de devolução
    cursor.execute("SELECT id, item, qtde, data, solicitante, almoxarife, descricao, devolucao, qtde_devolvida, status_devolucao FROM saidas ORDER BY id DESC")
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
    # Busca todos os itens do estoque
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


# ===== LOGIN =====
@app.route('/api/login', methods=['POST'])
def apilogin():

    username_digitado = request.form['username']
    senha_digitada = request.form['senha']
    tipo = request.form.get('tipo', '')

    conexao = banco()
    cursor = conexao.cursor(dictionary=True)

    # Decide qual tabela consultar
    if tipo == 'adm':
        cursor.execute(
            "SELECT * FROM administrador WHERE usuario = %s",
            (username_digitado,)
        )
    else:
        cursor.execute(
            "SELECT * FROM usuario WHERE usuario = %s",
            (username_digitado,)
        )
        
    usuario = cursor.fetchone()

    cursor.close()
    conexao.close()

    # Verifica senha usando bcrypt
    if usuario and bcrypt.checkpw(
        senha_digitada.encode('utf-8'),
        usuario['senha'].encode('utf-8')
    ):

        session['usuario'] = username_digitado
        session['tipo'] = tipo

        return redirect(url_for('home'))

    return """
<script>
    alert("Usuário ou senha incorretos");
    window.location.href = "/";
</script>
"""
# ===== ROTA AUXILIAR PARA O JAVASCRIPT CHECAR CREDENCIAIS DO ADM =====
@app.route('/api/checar_adm', methods=['POST'])
def api_checar_adm():
    dados = request.get_json() or {}
    username = dados.get('username', '').strip()
    senha = dados.get('senha', '').strip()

    if not username or not senha:
        return jsonify({'valido': False})

    conexao = banco()
    cursor = conexao.cursor(dictionary=True)

    # Busca o administrador no banco
    cursor.execute("SELECT * FROM administrador WHERE usuario = %s", (username,))
    usuario = cursor.fetchone()

    cursor.close()
    conexao.close()

    if usuario:
        # Pega a hash do banco e confere se a senha digitada bate
        senha_banco = usuario['senha']
        try:
            if bcrypt.checkpw(senha.encode('utf-8'), senha_banco.encode('utf-8')):
                session['usuario'] = username
                session['tipo'] = 'adm'
                return jsonify({'valido': True})
        except Exception:
            # Caso a senha no banco por algum motivo esteja em texto puro (sem criptografia)
            if senha == senha_banco:
                session['usuario'] = username
                session['tipo'] = 'adm'
                return jsonify({'valido': True})

    return jsonify({'valido': False})


# ===== CRIAR CONTA =====
@app.route('/api/criarconta', methods=['POST'])
def api_criarconta():
    # Segurança extra: impede que requisições diretas via Postman/Insomnia criem contas
    if 'usuario' not in session or session.get('tipo') != 'adm':
        return """
        <script>
            alert("Operação não autorizada!");
            window.location.href = "/";
        </script>
        """

    username  = request.form['username']
    senha     = request.form['senha']
    confirmar = request.form['confirmar']

    # Verifica se as senhas coincidem
    if senha != confirmar:
        return """
        <script>
            alert("As senhas não coincidem");
            window.location.href = "/criarconta";
        </script>
        """

    conexao = banco()
    cursor  = conexao.cursor(dictionary=True)

    # Verifica se o usuário já existe no banco
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

    # Gera o hash da senha antes de salvar no banco (segurança)
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
        window.location.href = "/estoque"; // Redireciona para onde achar melhor
    </script>
    """


# ===== ADICIONAR ITEM COM IMAGEM =====
@app.route('/api/adicionaritem', methods=['POST'])
def adicionaritem():
    nome          = request.form['nome']
    categoria     = request.form['categoria']
    descricao     = request.form['descricao']
    preco         = request.form['preco']
    quantidade    = request.form['quantidade']
    estoqueminimo = request.form['estoqueminimo']

    # Salva a imagem na pasta de uploads se foi enviada
    imagem = request.files.get('imagem')
    caminho_imagem = None
    if imagem and imagem.filename != '':
        caminho_imagem = imagem.filename
        imagem.save(os.path.join(app.config['UPLOAD_FOLDER'], imagem.filename))

    # Insere o item no banco de dados
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


# ===== BUSCAR ITEM POR ID (usado na tela de saídas) =====
@app.route('/api/item/<int:id>')
def api_item(id):
    conexao = banco()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT nome FROM estoque WHERE id = %s", (id,))
    item = cursor.fetchone()
    cursor.close()
    conexao.close()
    return jsonify(item if item else {})


# ===== REGISTRAR SAÍDA =====
@app.route('/api/registrarsaida', methods=['POST'])
def api_registrarsaida():
    dados = request.get_json()
    itens = dados.get('itens', [])
    obs   = dados.get('obs')  # finalidade/observação

    conexao = banco()
    cursor  = conexao.cursor()

    try:
        for item in itens:
            # Pegamos o 'devolucao' de dentro do dicionário do ITEM específico
            devolucao_item = item.get('devolucao', 'Não')

            # Insere a saída no banco com o status de devolução próprio deste item
            cursor.execute(
                """INSERT INTO saidas (item, qtde, descricao, categoria, solicitante, almoxarife, data, devolucao)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    item['nome'],
                    item['qtde'],
                    obs,
                    None,
                    dados.get('solicitante'),
                    dados.get('almoxarife'),
                    dados.get('data') or None,
                    devolucao_item  # Usando o valor individual do item aqui!
                )
            )
            # Diminui a quantidade no estoque
            cursor.execute(
                "UPDATE estoque SET quantidade = quantidade - %s WHERE id = %s",
                (item['qtde'], item['id'])
            )
        conexao.commit()
        return jsonify({'ok': True})

    except Exception as e:
        conexao.rollback()  # Desfaz tudo se der erro
        print("ERRO:", e)
        return jsonify({'ok': False, 'erro': str(e)}), 500

    finally:
        cursor.close()
        conexao.close()


# ===== BUSCAR ITEM COMPLETO POR ID (usado ao alterar item) =====
@app.route('/api/item_completo/<int:id>')
def api_item_completo(id):
    conexao = banco()
    cursor = conexao.cursor(dictionary=True)
    cursor.execute("SELECT * FROM estoque WHERE id = %s", (id,))
    item = cursor.fetchone()
    cursor.close()
    conexao.close()
    return jsonify(item if item else {})


# ===== ALTERAR ITEM =====
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
        # Se enviou nova imagem, salva e atualiza com ela
        caminho_imagem = imagem.filename
        imagem.save(os.path.join(app.config['UPLOAD_FOLDER'], imagem.filename))
        cursor.execute(
            """UPDATE estoque SET nome=%s, categoria=%s, descricao=%s,
               preco=%s, quantidade=%s, estoque_min=%s, imagem=%s
               WHERE id=%s""",
            (nome, categoria, descricao, preco, quantidade, estoqueminimo, caminho_imagem, id)
        )
    else:
        # Se não enviou imagem, mantém a imagem antiga
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


# ===== REGISTRAR DEVOLUÇÃO =====
@app.route('/api/devolucao', methods=['POST'])
def api_devolucao():
    dados    = request.get_json()
    nome     = dados.get('nome')       # nome do item devolvido
    qtde     = dados.get('qtde')       # quantidade devolvida
    status   = dados.get('status')     # 'parcial' ou 'total'
    saida_id = dados.get('saida_id')   # ID da saída que está sendo devolvida

    try:
        conexao = banco()
        cursor  = conexao.cursor()

        # Soma a quantidade devolvida de volta no estoque
        cursor.execute(
            "UPDATE estoque SET quantidade = quantidade + %s WHERE nome = %s",
            (qtde, nome)
        )

        # Salva o status e quantidade da devolução na tabela de saídas
        cursor.execute(
            "UPDATE saidas SET qtde_devolvida = %s, status_devolucao = %s WHERE id = %s",
            (qtde, status, saida_id)
        )

        conexao.commit()
        cursor.close()
        conexao.close()
        return jsonify({'ok': True})

    except Exception as e:
        print("ERRO DEVOLUÇÃO:", e)
        return jsonify({'ok': False, 'erro': str(e)}), 500
    

# ===== IMPORTAR CSV =====
@app.route('/api/importarcsv', methods=['POST'])
def api_importarcsv():
    import csv, io

    arquivo = request.files.get('arquivo')
    if not arquivo:
        return jsonify({'ok': False, 'erro': 'Nenhum arquivo enviado'}), 400

    try:
        conteudo = arquivo.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(conteudo), delimiter=';')

        conexao = banco()
        cursor = conexao.cursor()
        total = 0

        for linha in reader:
            nome        = linha.get('A (nome)', '').strip()
            categoria   = linha.get('B (categoria)', '').strip()
            descricao   = linha.get('C (descricao)', '').strip()
            preco_str   = linha.get('D (preco)', '0').strip().replace(',', '.')
            quantidade  = linha.get('E (quantidade)', '0').strip()
            estoque_min = linha.get('F (estoque_min)', '0').strip()

            if not nome:
                continue

            try:
                preco = float(preco_str)
            except:
                preco = 0.0

            cursor.execute(
                """INSERT INTO estoque (nome, categoria, descricao, preco, quantidade, estoque_min, imagem)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (nome, categoria, descricao, preco, quantidade, estoque_min, None)
            )
            total += 1

        conexao.commit()
        cursor.close()
        conexao.close()

        return jsonify({'ok': True, 'total': total})

    except Exception as e:
        print("ERRO IMPORTAR CSV:", e)
        return jsonify({'ok': False, 'erro': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0',port=80)