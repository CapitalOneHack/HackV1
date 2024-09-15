import { db } from '../data/firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Referencias a los elementos del DOM
const loanForm = document.getElementById('loan-form');
const cardsContainer = document.getElementById('cards-container');
const resultsSection = document.getElementById('results');

// Función para calcular el pago mensual aproximado
function calculateMonthlyPayment(monto, plazo, tasaInteres, comisionApertura) {
    const interesMensual = tasaInteres / 100 / 12;  // Convertir la tasa de interés anual a mensual
    const pagoMensual = (monto * interesMensual) / (1 - Math.pow(1 + interesMensual, -plazo));

    // Añadir la comisión de apertura (si la hay)
    const comision = (comisionApertura / 100) * monto;

    return pagoMensual + comision / plazo;  // Distribuir la comisión sobre los meses del préstamo
}

// Función para calcular el CAT usando la fórmula correcta
function calculateCAT(monto, plazo, pagoMensual, tasaInteres, comisionApertura) {
    const montoTotalAPagar = pagoMensual * plazo;
    const cat = Math.pow((montoTotalAPagar / monto), (12 / plazo)) - 1;
    return (cat * 100).toFixed(2);  // Convertir a porcentaje y redondear
}

// Función para cargar bancos y hacer el cálculo
async function loadBanksAndCalculate(amount, months) {
    try {
        const banksSnapshot = await getDocs(collection(db, 'bancos'));
        const banks = [];

        // Procesar cada banco
        banksSnapshot.forEach(doc => {
            const bankData = doc.data();

            // Convertir los valores correctamente a números para los cálculos
            const tasaInteres = parseFloat(bankData.tasaInteres);
            const comisionApertura = parseFloat(bankData.comisionApertura);

            const monthlyPayment = calculateMonthlyPayment(
                amount, 
                months, 
                tasaInteres, 
                comisionApertura
            );

            // Calcular el CAT para cada banco
            const cat = calculateCAT(amount, months, monthlyPayment, tasaInteres, comisionApertura);

            banks.push({
                ...bankData,
                monthlyPayment,
                cat  // Añadir el CAT calculado
            });
        });

        // Ordenar los bancos por pago mensual, de menor a mayor
        banks.sort((a, b) => a.monthlyPayment - b.monthlyPayment);

        // Mostrar solo los 5 primeros bancos
        // Mostrar solo los 6 primeros bancos
        displayResults(banks.slice(0, 6));  
    } catch (error) {
        console.error('Error al cargar los bancos:', error);
    }
}

// Función para mostrar los resultados en tarjetas
function displayResults(banks) {
  cardsContainer.innerHTML = '';  // Limpiar el contenedor de tarjetas

  banks.forEach((bank, index) => {
      const card = document.createElement('div');
      card.classList.add('col-md-4', 'position-relative'); // Añadido 'position-relative' para que el número se coloque correctamente.

      card.innerHTML = `
          <div class="card bank-card h-100">
              <!-- Número de clasificación de la tarjeta -->
              <div class="card-number">${index + 1}</div>
              <!-- Logo del banco -->
              <img src="${bank.imageUrl || 'https://via.placeholder.com/150'}" class="card-img-top" alt="${bank.name}">
              <div class="card-body bank-card-body">
                  <h5 class="bank-card-title">${bank.name}</h5>
                  <p class="bank-card-text">Comisión Apertura: <strong>${bank.comisionApertura}%</strong></p>
                  <p class="bank-card-text">Tasa de Interés: <strong>${bank.tasaInteres}%</strong></p>
                  <p class="bank-card-text">CAT: <strong>${bank.cat}%</strong></p>
                  <p class="monthly-payment">Pago Mensual: $${bank.monthlyPayment.toFixed(2)}</p>
                  <!-- Botón de más detalles -->
                  <button class="btn btn-danger mt-3">Más detalles</button>
              </div>
          </div>
      `;
      cardsContainer.appendChild(card);
  });

  // Mostrar la sección de resultados
  resultsSection.style.display = 'block';
}

// Validación de formulario usando Bootstrap
(function () {
    'use strict';
    loanForm.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();

        if (loanForm.checkValidity()) {
            // Obtener el monto y el plazo
            const amount = parseFloat(document.getElementById('amount').value);
            const months = parseInt(document.querySelector('input[name="months"]:checked').value);

            if (amount > 0 && months > 0) {
                // Cargar bancos y hacer el cálculo
                loadBanksAndCalculate(amount, months);
            } else {
                alert('Por favor ingresa un monto y selecciona un plazo válido.');
            }
        }

        loanForm.classList.add('was-validated');
    }, false);
})();

// Definición de la función en tu archivo main.js
function updateScoreLabel(value) {
  document.getElementById('scoreLabel').textContent = value;
}

// Hacer que la función esté disponible globalmente
window.updateScoreLabel = updateScoreLabel;