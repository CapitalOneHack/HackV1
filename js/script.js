document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal");
    const addTechBtn = document.getElementById("add-tech-btn");
    const closeModal = document.getElementById("close-modal");
    const techForm = document.getElementById("tech-form");
    const techniciansTable = document.getElementById("technicians-table");
    let editingIndex = null;

    // Muestra el modal para añadir/editar técnico
    addTechBtn.addEventListener("click", () => {
        document.getElementById("modal-title").innerText = "Añadir Técnico";
        modal.style.display = "block";
        techForm.reset();
        editingIndex = null;
    });

    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    // Añade o edita un técnico
    techForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const name = document.getElementById("name").value;
        const phone = document.getElementById("phone").value;
        const phone2 = document.getElementById("phone2").value;
        const address = document.getElementById("address").value;
        const zone = document.getElementById("zone").value;
        const comments = document.getElementById("comments").value;

        if (editingIndex === null) {
            // Añadir nuevo técnico
            const newRow = techniciansTable.insertRow();
            newRow.insertCell(0).innerText = techniciansTable.rows.length;
            newRow.insertCell(1).innerText = name;
            newRow.insertCell(2).innerText = phone;
            newRow.insertCell(3).innerText = phone2 || "undefined";
            newRow.insertCell(4).innerText = zone;
            const actionsCell = newRow.insertCell(5);
            actionsCell.innerHTML = '<span class="edit">✏️</span> <span class="delete">🗑️</span>';
            actionsCell.querySelector(".edit").addEventListener("click", () => editTech(newRow));
            actionsCell.querySelector(".delete").addEventListener("click", () => deleteTech(newRow));
        } else {
            // Editar técnico existente
            techniciansTable.rows[editingIndex].cells[1].innerText = name;
            techniciansTable.rows[editingIndex].cells[2].innerText = phone;
            techniciansTable.rows[editingIndex].cells[3].innerText = phone2 || "undefined";
            techniciansTable.rows[editingIndex].cells[4].innerText = zone;
        }

        modal.style.display = "none";
    });

    // Función para editar técnico
    function editTech(row) {
        document.getElementById("modal-title").innerText = "Editar Banco";
        modal.style.display = "block";
        editingIndex = row.rowIndex - 1;
        document.getElementById("name").value = row.cells[1].innerText;
        document.getElementById("phone").value = row.cells[2].innerText;
        document.getElementById("phone2").value = row.cells[3].innerText;
        document.getElementById("zone").value = row.cells[4].innerText;
    }

    // Función para eliminar técnico
    function deleteTech(row) {
        techniciansTable.deleteRow(row.rowIndex - 1);
    }
});