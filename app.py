from flask import Flask, render_template, request, jsonify
import sqlite3
import os

# Initialisation de l'application Flask
app = Flask(__name__, static_folder="static", template_folder="templates")

# Chemin vers la base de données
DB_PATH = "tasks.db"

# Vérifier que la base de données existe
if not os.path.exists(DB_PATH):
    print(f"Erreur : La base de données '{DB_PATH}' n'existe pas.")
    exit(1)

# Route pour la page index
@app.route("/")
def index():
    return render_template("index.html")

# Route pour la page admin
@app.route("/admin")
def admin():
    return render_template("admin.html")

# API : Récupérer toutes les tâches
@app.route("/tasks", methods=["GET"])
def get_tasks():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tasks")
        tasks = cursor.fetchall()
    except sqlite3.Error as e:
        return jsonify({"error": f"Erreur lors de la récupération des tâches : {e}"}), 500
    finally:
        conn.close()

    # Valider et formater les tâches
    validated_tasks = []
    for row in tasks:
        try:
            validated_tasks.append({
                "id": row[0],
                "axis": row[1],
                "task": row[2],
                "responsible": row[3],
                "start_date": row[4],
                "end_date": row[5],
                "status": row[6] if row[6] else "Null"  # Par défaut : "Null"
            })
        except IndexError:
            print(f"Tâche mal formée : {row}")
            continue

    return jsonify(validated_tasks)

# API : Ajouter une nouvelle tâche
@app.route("/tasks", methods=["POST"])
def add_task():
    data = request.json

    # Vérification des données reçues
    required_fields = ["axis", "task", "responsible", "start_date", "end_date"]
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Toutes les informations requises doivent être fournies."}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO tasks (axis, task, responsible, start_date, end_date, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data["axis"], data["task"], data["responsible"], data["start_date"], data["end_date"], "Null"))
        conn.commit()
    except sqlite3.Error as e:
        return jsonify({"error": f"Erreur lors de l'ajout de la tâche : {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Tâche ajoutée avec succès."}), 201

# API : Mettre à jour l'état d'une tâche
@app.route("/tasks/<int:task_id>/status", methods=["PUT"])
def update_task_status(task_id):
    data = request.json
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Le statut est requis."}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("UPDATE tasks SET status = ? WHERE id = ?", (new_status, task_id))
        conn.commit()
    except sqlite3.Error as e:
        return jsonify({"error": f"Erreur lors de la mise à jour du statut : {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Statut mis à jour avec succès."}), 200

# API : Récupérer les états disponibles
@app.route("/statuses", methods=["GET"])
def get_statuses():
    # États par défaut (on pourrait les gérer dynamiquement dans la base plus tard)
    statuses = ["Null", "En cours", "Finalisation", "Terminé"]
    return jsonify(statuses)

# API : Ajouter ou mettre à jour les états (non implémentée pour le moment)
@app.route("/statuses", methods=["POST"])
def manage_statuses():
    return jsonify({"message": "Gestion des états pas encore implémentée."}), 501

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)


@app.route("/db/add-column", methods=["POST"])
def add_column():
    data = request.json
    table_name = data.get("table")
    column_name = data.get("column")
    column_type = data.get("type")

    if not table_name or not column_name or not column_type:
        return jsonify({"error": "Tous les champs sont requis."}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Exécuter la commande pour ajouter une colonne
        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type};")
        conn.commit()
    except sqlite3.Error as e:
        return jsonify({"error": f"Erreur lors de la modification de la base : {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": f"Colonne '{column_name}' ajoutée avec succès à la table '{table_name}'."}), 200

# API : Récupérer tous les statuts
@app.route("/statuses", methods=["GET"])
def get_statuses():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id, name FROM statuses")
        statuses = cursor.fetchall()
    except sqlite3.Error as e:
        return jsonify({"error": f"Erreur lors de la récupération des statuts : {e}"}), 500
    finally:
        conn.close()

    return jsonify([{"id": row[0], "name": row[1]} for row in statuses])

# API : Ajouter un nouveau statut
@app.route("/statuses", methods=["POST"])
def add_status():
    data = request.json
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "Le statut est requis."}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("INSERT INTO statuses (name) VALUES (?)", (new_status,))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "Le statut existe déjà."}), 400
    except sqlite3.Error as e:
        return jsonify({"error": f"Erreur lors de l'ajout du statut : {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Statut ajouté avec succès."}), 201

# API : Modifier un statut existant
@app.route("/statuses/<int:status_id>", methods=["PUT"])
def update_status(status_id):
    data = request.json
    new_name = data.get("name")

    if not new_name:
        return jsonify({"error": "Le nouveau nom est requis."}), 400

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("UPDATE statuses SET name = ? WHERE id = ?", (new_name, status_id))
        conn.commit()
    except sqlite3.Error as e:
        return jsonify({"error": f"Erreur lors de la modification du statut : {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Statut modifié avec succès."}), 200

# API : Supprimer un statut
@app.route("/statuses/<int:status_id>", methods=["DELETE"])
def delete_status(status_id):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM statuses WHERE id = ?", (status_id,))
        conn.commit()
    except sqlite3.Error as e:
        return jsonify({"error": f"Erreur lors de la suppression du statut : {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Statut supprimé avec succès."}), 200
