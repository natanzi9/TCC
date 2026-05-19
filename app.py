from flask import Flask, render_template, request, redirect, url_for

import mysql.connector

app = Flask(__name__)

def banco():
    conexao = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="SistemaFiep"
    )
    return conexao


@app.route('/')
def login():
    return render_template("index.html")

@app.route('/home')
def home():
    return render_template("home.html")

@app.route('/adicionaritens')
def aditem():
    return render_template("adicionaritens.html")

@app.route('/estoque')
def estoque():
    return render_template("estoque.html")

@app.route('/saidas')
def saidas():
    return render_template("saidas.html")

@app.route('/criarconta')
def criarconta():                                   
    return render_template("criarconta.html")


@app.route('/api/login', methods=['POST'])
def apilogin():
    username = request.form['username']
    senha = request.form['senha']

    conexao = banco()
    cursor = conexao.cursor()

    cursor.execute(
        "SELECT * FROM almoxarifado WHERE usuario = %s AND senha = %s",
        (username, senha)
    )

    usuario = cursor.fetchone()

    cursor.close()
    conexao.close()

    if usuario:
        return redirect(url_for('home'))
    else:
        return render_template("index.html", erro="Usuário ou senha inválidos")

@app.route('/api/criarconta', methods=['POST'])
def api_criarconta():
    username = request.form['username']
    senha = request.form['senha']
    confirmar = request.form['confirmar']

    if senha != confirmar:
        return "As senhas não coincidem!", 400

    conexao = banco()
    cursor = conexao.cursor()

    try:
        comando = "INSERT INTO almoxarifado (usuario, senha) VALUES (%s, %s)"
        cursor.execute(comando, (username, senha))
        
        conexao.commit()
        
        return render_template("index.html", mensagem="Conta criada com sucesso!")
    
    except mysql.connector.Error as err:
        return f"Erro no banco de dados: {err}", 500
    
    finally:
        cursor.close()
        conexao.close()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')