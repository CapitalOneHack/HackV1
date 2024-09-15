import { db } from '../data/firebase.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

// Inicializar Firebase Storage
const storage = getStorage();

// Referencias a los elementos del DOM
const addTechBtn = document.getElementById('add-tech-btn');
const techForm = document.getElementById('tech-form');
const techTable = document.getElementById('technicians-table');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('close-modal');
const modalTitle = document.getElementById('modal-title');

// Variables para editar
let editMode = false;
let currentDocId = null;

// Mostrar modal para agregar un nuevo banco
addTechBtn.addEventListener('click', () => {
    editMode = false;
    currentDocId = null;
    techForm.reset();
    modalTitle.textContent = 'Añadir Banco';
    modal.style.display = 'block';
});

// Cerrar el modal
closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
});

// Función para subir la imagen a Firebase Storage
async function uploadImage(file) {
    const storageRef = ref(storage, `images/${file.name}`);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL; // URL pública de la imagen
    } catch (error) {
        console.error("Error al subir la imagen:", error);
        throw error;
    }
}

// Guardar un nuevo banco
techForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newBank = {
        name: techForm['name'].value,
        comisionApertura: techForm['phone'].value,
        tasaInteres: techForm['phone2'].value,
        cat: techForm['zone'].value,
    };

    const fileInput = document.getElementById('file');
    const file = fileInput.files[0];

    try {
        if (file) {
            // Subir imagen y obtener la URL
            const imageUrl = await uploadImage(file);
            newBank.imageUrl = imageUrl;  // Añadir la URL de la imagen a los datos del banco
        }

        if (editMode) {
            // Si está en modo edición, actualiza el banco
            const bankDoc = doc(db, "bancos", currentDocId);
            await updateDoc(bankDoc, newBank);
            console.log('Banco actualizado');
        } else {
            // Si no está en modo edición, agrega un nuevo banco
            await addDoc(collection(db, 'bancos'), newBank);
            console.log('Banco agregado');
        }

        modal.style.display = 'none';
        loadBanks();  // Recargar la tabla
    } catch (error) {
        console.error('Error al guardar el banco:', error);
    }
});

// Cargar los bancos existentes desde Firestore
async function loadBanks() {
    techTable.innerHTML = '';  // Limpiar la tabla

    try {
        const querySnapshot = await getDocs(collection(db, 'bancos'));
        querySnapshot.forEach((doc, index) => {
            const bank = doc.data();
            const row = `
                <tr>
                    <td><img src="${bank.imageUrl || '#'}" alt="Banco Image" width="50"></td> <!-- Imagen en la primera columna -->
                    <td>${bank.name}</td>
                    <td>${bank.comisionApertura}</td>
                    <td>${bank.tasaInteres}</td>
                    <td>${bank.cat}</td>
                    <td>
                        <button class="edit-btn" data-id="${doc.id}">Editar</button>
                        <button class="delete-btn" data-id="${doc.id}">Eliminar</button>
                    </td>
                </tr>
            `;
            techTable.innerHTML += row;
        });

        // Agregar eventos para los botones de editar y eliminar
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', handleEdit);
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', handleDelete);
        });

    } catch (error) {
        console.error('Error al cargar los bancos:', error);
    }
}

// Manejar la edición de un banco
async function handleEdit(e) {
    const docId = e.target.dataset.id;
    const bankDoc = await getDoc(doc(db, 'bancos', docId));

    if (bankDoc.exists()) {
        const bank = bankDoc.data();
        techForm['name'].value = bank.name;
        techForm['phone'].value = bank.comisionApertura;
        techForm['phone2'].value = bank.tasaInteres;
        techForm['zone'].value = bank.cat;

        editMode = true;
        currentDocId = docId;
        modalTitle.textContent = 'Editar Banco';
        modal.style.display = 'block';
    }
}

// Manejar la eliminación de un banco
async function handleDelete(e) {
    const docId = e.target.dataset.id;

    try {
        await deleteDoc(doc(db, 'bancos', docId));
        console.log('Banco eliminado');
        loadBanks();  // Recargar la tabla
    } catch (error) {
        console.error('Error al eliminar el banco:', error);
    }
}

// Cargar los bancos cuando se cargue la página
document.addEventListener('DOMContentLoaded', loadBanks);
