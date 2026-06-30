MUDAR URL:

1
Abrir o CMD como administrador

Pressione Win + R, digite o comando abaixo e pressione Ctrl + Shift + Enter para abrir como admin.

cmd

2
Abrir o arquivo hosts no Notepad

Cole o comando no CMD e pressione Enter. O arquivo abrirá automaticamente.

notepad C:\Windows\System32\drivers\etc\hosts

3
Adicionar seu domínio local

No final do arquivo, adicione uma nova linha com o formato abaixo. Troque meusite.local pelo nome que quiser.

127.0.0.1   meusite.local

Salve com Ctrl + S e feche o Notepad.

4
Limpar o cache DNS

De volta ao CMD (ainda como admin), rode o comando para aplicar as mudanças.

ipconfig /flushdns

5
Testar no navegador

Certifique-se que seu servidor local está rodando (Flask, XAMPP, Laragon...) e acesse:

http://meusite.local
