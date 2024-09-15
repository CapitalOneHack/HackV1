import { db } from '../data/firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
/*
if (comisionApertura === 0 ){
  return parseFloat(tasaInteres.tofixed(2));
}
*/

// Referencias a los elementos del DOM
const loanForm = document.getElementById('loan-form');
const cardsContainer = document.getElementById('cards-container');
const resultsSection = document.getElementById('results');

// Función para clasificar el score y ajustar la tasa de interés
function ajustarTasaPorScore(tasaBase, score) {
  let tasaAjustada = tasaBase;

  if (score >= 720 && score <= 850) {
      // Excelente (no se ajusta)
      tasaAjustada = tasaBase;
  } else if (score >= 690 && score < 720) {
      // Bueno (aumenta 5%)
      tasaAjustada = tasaBase * 1.05;
  } else if (score >= 630 && score < 690) {
      // Regular (aumenta 10%)
      tasaAjustada = tasaBase * 1.10;
  } else if (score >= 300 && score < 630) {
      // Malo (aumenta 15%)
      tasaAjustada = tasaBase * 1.15;
  }

  return parseFloat(tasaAjustada.toFixed(2));  // Redondeamos la tasa ajustada a 2 decimales
}

// Función para calcular el pago mensual utilizando la fórmula de amortización
function calculateMonthlyPayment(monto, plazo, tasaInteres) {
  const interesMensual = tasaInteres / 100 / 12;  // Convertir la tasa de interés anual a mensual
  const pagoMensual = (monto * interesMensual) / (1 - Math.pow(1 + interesMensual, -plazo));
  return parseFloat(pagoMensual.toFixed(2));  // Redondear a 2 decimales
}

// Nueva función para calcular el CAT
function calculateCAT(monto, plazo, pagos, comisionApertura) {
  // Convertir la comisión de apertura a valor absoluto
  const comision = (comisionApertura / 100) * monto;

  // Sumar el valor presente de los pagos
  let sumaPagosValorPresente = 0;
  for (let j = 1; j <= plazo; j++) {
    sumaPagosValorPresente += pagos[j - 1] / Math.pow(1 + 0.01, j / 12);  // Ajustamos la tasa efectiva para el cálculo
  }

  // Calcular el monto total a pagar
  const montoTotalAPagar = sumaPagosValorPresente + comision;

  console.log(`Monto total a pagar (incluyendo comisión y valor presente de los pagos): ${montoTotalAPagar.toFixed(2)}`);

  // Calcular el CAT anualizado
  const cat = Math.pow((montoTotalAPagar / monto), (12 / plazo)) - 1;

  // Mostrar el CAT calculado en la consola
  console.log(`CAT calculado con nueva fórmula: ${(cat * 100).toFixed(2)}%`);

  return parseFloat((cat * 100).toFixed(2));
}

// Función para cargar los bancos y calcular el CAT y los pagos mensuales
async function loadBanksAndCalculate(amount, months) {
  try {
      const score = parseInt(document.getElementById('creditScore').value);  // Obtener el score del usuario
      const banksSnapshot = await getDocs(collection(db, 'bancos'));
      const banks = [];

      // Procesar cada banco
      banksSnapshot.forEach(doc => {
          const bankData = doc.data();

          // Convertir los valores correctamente a números para los cálculos
          let tasaInteresBase = parseFloat(bankData.tasaInteres);
          const comisionApertura = parseFloat(bankData.comisionApertura);

          // Ajustar la tasa de interés en función del score del usuario
          const tasaInteresAjustada = ajustarTasaPorScore(tasaInteresBase, score);

          // Loguear los datos que estamos obteniendo de Firebase para verificar
          console.log(`Banco: ${bankData.name}`);
          console.log(`Tasa de interés base: ${tasaInteresBase}%`);
          console.log(`Tasa de interés ajustada: ${tasaInteresAjustada}%`);
          console.log(`Comisión de apertura: ${comisionApertura}%`);

          // Calcular el pago mensual con la tasa ajustada
          const monthlyPayment = calculateMonthlyPayment(amount, months, tasaInteresAjustada);
          const pagos = Array(months).fill(monthlyPayment);  // Crear el array de pagos iguales durante el plazo

          // Calcular el CAT
          const cat = calculateCAT(amount, months, pagos, comisionApertura);

          // Guardar la tasa ajustada dentro del objeto del banco
          banks.push({
              ...bankData,
              monthlyPayment,
              cat,  // Añadir el CAT calculado
              tasaInteresAjustada  // Añadir la tasa ajustada
          });
      });

      // Ordenar los bancos por CAT, de menor a mayor
      banks.sort((a, b) => parseFloat(a.cat) - parseFloat(b.cat));

      // Mostrar solo los primeros 6 bancos
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

      // Asegurarnos de que se muestre la tasa ajustada, no solo la base
      const tasaInteresAjustada = bank.tasaInteresAjustada || bank.tasaInteres;

      card.innerHTML = `
          <div class="card bank-card h-100">
              <!-- Número de clasificación de la tarjeta -->
              <div class="card-number">${index + 1}</div>
              <!-- Logo del banco -->
              <img src="${bank.imageUrl || 'https://via.placeholder.com/150'}" class="card-img-top" alt="${bank.name}">
              <div class="card-body bank-card-body">
                  <h5 class="bank-card-title">${bank.name}</h5>
                  <p class="bank-card-text">Comisión Apertura: <strong>${bank.comisionApertura}%</strong></p>
                  <p class="bank-card-text">Tasa de Interés (Ajustada): <strong>${tasaInteresAjustada}%</strong></p>
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