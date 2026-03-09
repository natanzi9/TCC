from flask import Flask, render_template

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run(debug=True)

@app.route('/criarconta')
def login():
    return render_template("criarconta")