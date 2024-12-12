// Déclaration des éléments DOM
const statusList = document.getElementById("status-list");
const addStatusForm = document.getElementById("add-status-form");
const taskForm = document.getElementById("task-form");
const messageElement = document.getElementById("message");

// Gestion des tâches
taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const axis = document.getElementById("axis").value;
    const task = document.getElementById("task").value;
    const responsible = document.getElementById("responsible").value;
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;

    // Validation des données
    if (!axis || !task || !responsible || !start || !end) {
        displayMessage("Veuillez remplir tous les champs du formulaire.", "error");
        return;
    }

    fetch("/tasks", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ axis, task, responsible, start_date: start, end_date: end }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            displayMessage(data.message || "Tâche ajoutée avec succès.", "success");
            taskForm.reset();
        })
        .catch((error) => {
            console.error("Erreur lors de l'ajout de la tâche :", error);
            displayMessage("Erreur lors de l'ajout de la tâche.", "error");
        });
});

// Charger les statuts
function loadStatuses() {
    fetch("/statuses")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }
            return response.json();
        })
        .then((statuses) => {
            statusList.innerHTML = ""; // Effacer la liste actuelle
            statuses.forEach((status) => {
                if (status && status.name && status.id) {
                    const li = document.createElement("li");
                    li.innerHTML = `
                        <span>${status.name}</span>
                        <button class="edit-status" data-id="${status.id}">Modifier</button>
                        <button class="delete-status" data-id="${status.id}">Supprimer</button>
                    `;
                    statusList.appendChild(li);
                }
            });

            // Ajouter les gestionnaires pour "Modifier" et "Supprimer"
            addStatusEventListeners();
        })
        .catch((error) => {
            console.error("Erreur lors du chargement des statuts :", error);
            displayMessage("Erreur lors du chargement des statuts.", "error");
        });
}

// Ajouter les gestionnaires pour "Modifier" et "Supprimer"
function addStatusEventListeners() {
    document.querySelectorAll(".edit-status").forEach((button) => {
        button.addEventListener("click", (event) => {
            const id = event.target.getAttribute("data-id");
            const newName = prompt("Entrez le nouveau nom du statut :");
            if (newName) {
                updateStatus(id, newName);
            }
        });
    });

    document.querySelectorAll(".delete-status").forEach((button) => {
        button.addEventListener("click", (event) => {
            const id = event.target.getAttribute("data-id");
            if (confirm("Voulez-vous vraiment supprimer ce statut ?")) {
                deleteStatus(id);
            }
        });
    });
}

// Ajouter un nouveau statut
addStatusForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const newStatus = document.getElementById("new-status").value;

    if (!newStatus) {
        displayMessage("Veuillez entrer un nom de statut.", "error");
        return;
    }

    fetch("/statuses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            displayMessage(data.message || "Statut ajouté avec succès.", "success");
            loadStatuses(); // Recharger la liste des statuts
            addStatusForm.reset();
        })
        .catch((error) => {
            console.error("Erreur lors de l'ajout du statut :", error);
            displayMessage("Erreur lors de l'ajout du statut.", "error");
        });
});

// Modifier un statut
function updateStatus(id, newName) {
    if (!id || !newName) {
        console.error("ID ou nouveau nom invalide");
        return;
    }

    fetch(`/statuses/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newName }),
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            displayMessage(data.message || "Statut modifié avec succès.", "success");
            loadStatuses(); // Recharger la liste des statuts
        })
        .catch((error) => {
            console.error("Erreur lors de la modification du statut :", error);
            displayMessage("Erreur lors de la modification du statut.", "error");
        });
}

// Supprimer un statut
function deleteStatus(id) {
    if (!id) {
        console.error("ID invalide pour la suppression");
        return;
    }

    fetch(`/statuses/${id}`, {
        method: "DELETE",
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            displayMessage(data.message || "Statut supprimé avec succès.", "success");
            loadStatuses(); // Recharger la liste des statuts
        })
        .catch((error) => {
            console.error("Erreur lors de la suppression du statut :", error);
            displayMessage("Erreur lors de la suppression du statut.", "error");
        });
}

// Afficher un message dans l'interface
function displayMessage(message, type) {
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = "block";
        messageElement.style.color = type === "success" ? "green" : "red";
        setTimeout(() => {
            messageElement.style.display = "none";
        }, 3000);
    }
}

// Charger les statuts au démarrage
loadStatuses();
