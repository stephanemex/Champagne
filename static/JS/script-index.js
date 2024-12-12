document.addEventListener("DOMContentLoaded", () => {
    // Récupérer les tâches via l'API Flask
    fetch("/tasks")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((tasks) => {
            const tableBody = document.querySelector("#task-table tbody");

            // Ajouter les tâches au tableau HTML
            tasks.forEach((task) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${task.axis}</td>
                    <td>${task.task}</td>
                    <td>${task.responsible}</td>
                    <td>${task.start_date}</td>
                    <td>${task.end_date}</td>
                    <td>
                        <select data-task-id="${task.id}" class="status-dropdown">
                            <option value="Null" ${task.status === "Null" ? "selected" : ""}>Null</option>
                            <option value="En cours" ${task.status === "En cours" ? "selected" : ""}>En cours</option>
                            <option value="Finalisation" ${task.status === "Finalisation" ? "selected" : ""}>Finalisation</option>
                            <option value="Terminé" ${task.status === "Terminé" ? "selected" : ""}>Terminé</option>
                        </select>
                    </td>
                `;
                tableBody.appendChild(row);
            });
// Gérer la mise à jour de l'état
document.querySelectorAll(".status-dropdown").forEach((dropdown) => {
    dropdown.addEventListener("change", (event) => {
        const taskId = event.target.getAttribute("data-task-id");
        const newStatus = event.target.value;

        fetch(`/tasks/${taskId}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus }),
        })
            .then((response) => response.json())
            .then((data) => console.log(data.message))
            .catch((error) => console.error("Erreur lors de la mise à jour :", error));
    });
});            

            // Générer le diagramme de Gantt
            updateGanttChart(tasks);
        })
        .catch((error) => console.error("Erreur lors de la récupération des tâches :", error));
});

function updateGanttChart(tasks) {
    const ganttChartCanvas = document.getElementById("gantt-chart");

    // Préparer les données pour le diagramme
    const datasets = tasks.map((task, index) => ({
        label: task.task, // Nom de la tâche
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        data: [
            {
                x: task.start_date, // Date de début
                x2: task.end_date,  // Date de fin
                y: index + 1,       // Position sur l'axe Y
            },
        ],
    }));

    // Configuration et création du diagramme
    new Chart(ganttChartCanvas, {
        type: "bar",
        data: {
            datasets,
        },
        options: {
            indexAxis: "y", // Orientation horizontale
            scales: {
                x: {
                    type: "time", // Échelle temporelle
                    time: {
                        unit: "day", // Granularité de l'échelle
                    },
                    title: {
                        display: true,
                        text: "Dates",
                    },
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                    },
                    title: {
                        display: true,
                        text: "Tâches",
                    },
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const { x, x2 } = context.raw;
                            return `Début : ${x}, Fin : ${x2}`;
                        },
                    },
                },
            },
        },
    });
}
