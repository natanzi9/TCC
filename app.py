from flask import Flask, render_template, request
import mysql.connector

app = Flask(__name__)
def banco():
    conecxao = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="SistemaFiep"
    )
    return conecxao

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

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    senha = request.form['senha']

    conexao = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="SistemaFiep"
    )

    cursor = conexao.cursor()

    cursor.execute(
        "SELECT * FROM almoxarifado WHERE usuario = %s AND senha = %s",
        (username, senha)
    )

    usuario = cursor.fetchone()

    cursor.close()
    conexao.close()

    if usuario:
        return render_template("home.html")
    else:
        return render_template("index.html", erro="Usuário ou senha inválidos")
if __name__ == '__main__':
    app.run(debug=True, host = '0.0.0.0')