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

# ===== SUPORTE CORS PARA O APP MOBILE (EXPO) =====
@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        response = app.make_default_options_response()
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response

@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response


# ===== CONEXÃO COM O BANCO DE DADOS =====
def banco():
    return mysql.connector.connect(
        host="db_almox",
        user="root",
        password="root",  
        database="tcc"
    )

# ===== PÁGINAS =====

@app.route('/')
def login():
    # Página inicial de login
    return render_template("index.html")

@app.route('/api/apagar_estoque', methods=['POST'])
def apagar_estoque():
    conexao = banco()
    cursor = conexao.cursor()

    cursor.execute("TRUNCATE TABLE estoque")

    conexao.commit()
    cursor.close()
    conexao.close()

    return redirect(url_for('estoque'))

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
    cursor.execute("SELECT * FROM estoque ORDER BY id ASC")
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


def _verificar_senha(usuario_obj, senha_plana):
    if not usuario_obj:
        return False
    senha_banco = usuario_obj.get('senha')
    if not senha_banco:
        return False
    if isinstance(senha_banco, bytes):
        senha_banco = senha_banco.decode('utf-8', errors='ignore')
    try:
        if bcrypt.checkpw(senha_plana.encode('utf-8'), senha_banco.encode('utf-8')):
            return True
    except Exception:
        pass
    return senha_plana == senha_banco

# ===== CHECAR LOGIN (MOBILE APP E API JSON) =====
@app.route('/api/checar_login', methods=['POST'])
def api_checar_login():
    try:
        dados = request.get_json(silent=True) or {}
        username = str(dados.get('username') or '').strip()
        senha = str(dados.get('senha') or '').strip()
        tipo_preferido = str(dados.get('tipo') or '').strip().lower()

        if not username or not senha:
            return jsonify({'sucesso': False, 'valido': False, 'erro': 'Preencha usuário e senha.'}), 400

        conexao = banco()
        cursor = conexao.cursor(dictionary=True)

        # Enforcement estrito: tipo=adm → apenas tabela administrador
        if tipo_preferido == 'adm':
            cursor.execute("SELECT * FROM administrador WHERE usuario = %s", (username,))
            adm = cursor.fetchone()
            cursor.close()
            conexao.close()
            if adm and _verificar_senha(adm, senha):
                session['usuario'] = username
                session['tipo'] = 'adm'
                return jsonify({
                    'sucesso': True,
                    'valido': True,
                    'tipo': 'adm',
                    'usuario': username
                }), 200
            return jsonify({
                'sucesso': False,
                'valido': False,
                'erro': 'Credenciais de administrador inválidas.'
            }), 401

        # Enforcement estrito: tipo=user (ou qualquer outro) → apenas tabela usuario
        cursor.execute("SELECT * FROM usuario WHERE usuario = %s", (username,))
        usr = cursor.fetchone()
        cursor.close()
        conexao.close()
        if usr and _verificar_senha(usr, senha):
            session['usuario'] = username
            session['tipo'] = 'user'
            return jsonify({
                'sucesso': True,
                'valido': True,
                'tipo': 'user',
                'usuario': username
            }), 200

        return jsonify({
            'sucesso': False,
            'valido': False,
            'erro': 'Usuário ou senha incorretos.'
        }), 401

    except Exception as e:
        print("ERRO EM /api/checar_login:", e)
        return jsonify({'sucesso': False, 'valido': False, 'erro': str(e)}), 500


# ===== LOGIN =====
@app.route('/api/login', methods=['POST'])
def apilogin():
    # Se a requisição veio em formato JSON (App Mobile)
    if request.is_json or (request.content_type and 'application/json' in request.content_type):
        return api_checar_login()

    username_digitado = request.form.get('username', '').strip()
    senha_digitada = request.form.get('senha', '').strip()
    tipo = request.form.get('tipo', '').strip()

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

    # Verifica senha usando bcrypt ou texto puro
    if usuario and _verificar_senha(usuario, senha_digitada):
        session['usuario'] = username_digitado
        session['tipo'] = tipo or ('adm' if tipo == 'adm' else 'user')
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
    dados = request.get_json(silent=True) or {}
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

    if usuario and _verificar_senha(usuario, senha):
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
    if request.is_json:
        dados = request.get_json() or {}
        nome          = dados.get('nome')
        categoria     = dados.get('categoria', '')
        descricao     = dados.get('descricao', '')
        preco         = dados.get('preco', 0)
        quantidade    = dados.get('quantidade', 0)
        estoqueminimo = dados.get('estoqueminimo', dados.get('estoque_min', 0))
        imagem        = dados.get('imagem')

        conexao = banco()
        cursor = conexao.cursor()
        if imagem:
            cursor.execute(
                """UPDATE estoque SET nome=%s, categoria=%s, descricao=%s,
                   preco=%s, quantidade=%s, estoque_min=%s, imagem=%s
                   WHERE id=%s""",
                (nome, categoria, descricao, preco, quantidade, estoqueminimo, imagem, id)
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
        return jsonify({'sucesso': True, 'mensagem': 'Item alterado com sucesso!'}), 200

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

# ===== EXPORTAR CSV =====
from flask import make_response  # Certifique-se de que essa importação está no topo ou use aqui dentro

@app.route('/api/exportarcsv')
def api_exportarcsv():
    try:
        # 1. Abre a conexão com o banco de dados
        conexao = banco()
        cursor = conexao.cursor(dictionary=True)
        
        # 2. Busca todos os itens cadastrados no estoque
        cursor.execute("SELECT * FROM estoque ORDER BY id ASC")
        itens_estoque = cursor.fetchall()
        
        cursor.close()
        conexao.close()

        # 3. Cria o arquivo em memória usando io.StringIO
        output = io.StringIO()
        writer = csv.writer(output, delimiter=';')
        
        # Cabeçalhos das colunas
        writer.writerow(['A (nome)', 'B (categoria)', 'C (descricao)', 'D (preco)', 'E (quantidade)', 'F (estoque_min)'])
        
        # 4. Escreve os itens tratando valores Nulos (None) para não quebrar o script
        for item in itens_estoque:
            # Tratamento para o preço (evita quebrar se vier nulo ou formato inválido)
            preco_val = item.get('preco') if item.get('preco') is not None else 0.0
            preco_formatado = str(preco_val).replace('.', ',')
            
            writer.writerow([
                item.get('nome', ''),
                item.get('categoria', '') if item.get('categoria') else '',
                item.get('descricao', '') if item.get('descricao') else '',
                preco_formatado,
                item.get('quantidade', 0),
                item.get('estoque_min', 0)
            ])
        
        # 5. Captura o texto gerado pelo StringIO e fecha o objeto
        conteudo_puro = output.getvalue()
        output.close()
        
        # 6. Converte o texto para bytes usando 'utf-8-sig'.
        # Isso gera o sinalizador (BOM) perfeito que obriga o Excel a reconhecer os acentos.
        conteudo_bytes = conteudo_puro.encode('utf-8-sig')
        
        # 7. Cria a resposta HTTP correta enviando os BYTES
        response = make_response(conteudo_bytes)
        response.headers["Content-Disposition"] = "attachment; filename=estoque.csv"
        response.headers["Content-Type"] = "text/csv; charset=utf-8"
        
        return response

    except Exception as e:
        # Esse print vai mostrar o erro exato no seu terminal/prompt do Python!
        print("====== ERRO EXATO NO CSV ======")
        print(e)
        print("===============================")
        
        return """
        <script>
            alert("Erro ao gerar o arquivo CSV. Verifique o terminal do servidor.");
            window.location.href = "/estoque";
        </script>
        """

@app.route('/api/saidas', methods=['GET'])
def api_get_saidas():
    """Retorna todas as saídas registradas (endpoint para o app mobile)."""
    try:
        conexao = banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute(
            "SELECT id, item, qtde, descricao, categoria, solicitante, almoxarife, "
            "DATE_FORMAT(data, '%Y-%m-%d') AS data, devolucao, qtde_devolvida, status_devolucao "
            "FROM saidas ORDER BY id DESC"
        )
        saidas = cursor.fetchall()

        cursor.close()
        conexao.close()

        return jsonify({'sucesso': True, 'saidas': saidas}), 200

    except Exception as e:
        print("ERRO AO BUSCAR SAIDAS:", e)
        return jsonify({'sucesso': False, 'erro': str(e)}), 500


@app.route('/api/estoque', methods=['GET'])
def api_get_estoque():
    try:
        conexao = banco()
        cursor = conexao.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM estoque")
        itens = cursor.fetchall()
        
        cursor.close()
        conexao.close()
        
        return jsonify({
            'sucesso': True,
            'total_itens': len(itens),
            'estoque': itens
        }), 200

    except Exception as e:
        print("ERRO AO BUSCAR ESTOQUE:", e)
        return jsonify({'sucesso': False, 'erro': str(e)}), 500

@app.route('/api/mostraruser', methods=['GET'])
def api_mostra_users():
    try:
        conexao = banco()
        cursor = conexao.cursor(dictionary=True)
        
        cursor.execute("SELECT * FROM usuario")
        usuario = cursor.fetchall()
        
        cursor.close()
        conexao.close()
        
        return jsonify({
            'sucesso': True,
            'usuario': len(usuario),
            'usuarios': usuario
        }), 200

    except Exception as e:
        print("ERRO AO BUSCAR USUARIO:", e)
        return jsonify({'sucesso': False, 'erro': str(e)}), 500

from flask import Flask, request, jsonify

# (Seu código existente de conexão e da rota GET continua aqui...)

@app.route('/api/adicionarestoque', methods=['POST'])
def api_post_estoque():
    try:
        dados = request.get_json() or {}
        
        nome = dados.get('nome')
        quantidade = dados.get('quantidade')
        preco = dados.get('preco')
        categoria = dados.get('categoria', '')
        descricao = dados.get('descricao', '')
        estoque_min = dados.get('estoque_min', dados.get('estoqueminimo', 0))
        imagem = dados.get('imagem')
        
        if not nome or quantidade is None or preco is None:
            return jsonify({
                'sucesso': False,
                'erro': 'Campos obrigatórios ausentes (nome, quantidade, preco).'
            }), 400

        conexao = banco()
        cursor = conexao.cursor()
        
        sql = """INSERT INTO estoque (nome, categoria, descricao, preco, quantidade, estoque_min, imagem)
                 VALUES (%s, %s, %s, %s, %s, %s, %s)"""
        valores = (nome, categoria, descricao, preco, quantidade, estoque_min, imagem)
        
        cursor.execute(sql, valores)
        conexao.commit()
        novo_id = cursor.lastrowid
        
        cursor.close()
        conexao.close()
        
        return jsonify({
            'sucesso': True,
            'mensagem': 'Item cadastrado com sucesso!',
            'id': novo_id
        }), 201

    except Exception as e:
        print("ERRO AO CADASTRAR ITEM NO ESTOQUE:", e)
        return jsonify({'sucesso': False, 'erro': str(e)}), 500

@app.route('/api/removeritem/<int:id_item>', methods=['DELETE'])
def remover_item(id_item):
    try:
        conexao = banco()
        cursor = conexao.cursor()

        cursor.execute("DELETE FROM estoque WHERE id = %s", (id_item,))
        if cursor.rowcount == 0:
            cursor.close()
            conexao.close()
            return jsonify({'sucesso': False, 'erro': 'Item não encontrado.'}), 404

        conexao.commit()
        cursor.close()
        conexao.close()

        return jsonify({'sucesso': True, 'mensagem': f'Item {id_item} removido com sucesso!'}), 200

    except Exception as e:
        print("ERRO AO REMOVER ITEM:", e)
        return jsonify({'sucesso': False, 'erro': str(e)}), 500

@app.route('/api/adicionaruser', methods=['POST'])
def api_post_user():
    try:
        dados = request.get_json() or {}

        usuario = dados.get('usuario')
        senha = dados.get('senha')

        if not usuario or senha is None:
            return jsonify({
                'sucesso': False,
                'erro': 'Campos obrigatórios ausentes (usuario, senha).'
            }), 400

        conexao = banco()
        cursor = conexao.cursor(dictionary=True)

        cursor.execute("SELECT id FROM usuario WHERE usuario = %s", (usuario,))
        if cursor.fetchone():
            cursor.close()
            conexao.close()
            return jsonify({
                'sucesso': False,
                'erro': 'Usuário já cadastrado!'
            }), 400

        hash_senha = bcrypt.hashpw(str(senha).encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor2 = conexao.cursor()
        sql = "INSERT INTO usuario (usuario, senha) VALUES (%s, %s)"
        cursor2.execute(sql, (usuario, hash_senha))
        conexao.commit()

        novo_id = cursor2.lastrowid
        cursor2.close()
        cursor.close()
        conexao.close()

        return jsonify({
            'sucesso': True,
            'mensagem': 'Usuário cadastrado com sucesso!',
            'id': novo_id
        }), 201

    except Exception as e:
        print("ERRO AO CADASTRAR USUARIO:", e)
        return jsonify({
            'sucesso': False,
            'erro': str(e)
        }), 500

@app.route('/api/remover/<int:id_usuario>', methods=['DELETE'])
def remover_usuario(id_usuario):
    try:
        conexao = banco()
        cursor = conexao.cursor()

        sql = "DELETE FROM usuario WHERE id = %s"
        cursor.execute(sql, (id_usuario,))

        if cursor.rowcount == 0:
            cursor.close()
            conexao.close()

            return jsonify({
                'sucesso': False,
                'erro': 'Usuário não encontrado.'
            }), 404

        conexao.commit()

        cursor.close()
        conexao.close()

        return jsonify({
            'sucesso': True,
            'mensagem': f'Usuário {id_usuario} removido com sucesso!'
        }), 200

    except Exception as e:
        print("ERRO AO REMOVER USUARIO:", e)

        return jsonify({
            'sucesso': False,
            'erro': str(e)
        }), 500
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)