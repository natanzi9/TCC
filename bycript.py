import bcrypt

senha = b"123"  
hash = bcrypt.hashpw(senha, bcrypt.gensalt()).decode()
print(hash)