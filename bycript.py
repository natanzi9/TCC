import bcrypt

senha = b"senai2026"  
hash = bcrypt.hashpw(senha, bcrypt.gensalt()).decode()
print(hash)