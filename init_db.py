import sqlite3

# Connexion à la base SQLite
conn = sqlite3.connect('tasks.db')  # Crée ou ouvre le fichier tasks.db
cursor = conn.cursor()

# Création de la table tasks
cursor.execute('''
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    axis TEXT NOT NULL,
    task TEXT NOT NULL,
    responsible TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL
)
''')

conn.commit()
conn.close()
print("Base de données initialisée avec succès.")

