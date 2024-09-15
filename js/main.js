import { db } from '../data/firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Referencias a los elementos del DOM
const loanForm = document.getElementById('loan-form');
const resultsTable = document.getElementById('banks-results');


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

  console.log(`Monto Total a Pagar: ${montoTotalAPagar}`);

  const cat = Math.pow((montoTotalAPagar / monto), (12 / plazo)) - 1;

  console.log(`CAT Calculado: ${(cat * 100).toFixed(2)}%`);

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

      // Mostrar los bancos en la tabla
      displayResults(banks);
  } catch (error) {
      console.error('Error al cargar los bancos:', error);
  }
}

// Función para mostrar los resultados en la tabla
function displayResults(banks) {
  resultsTable.innerHTML = '';  // Limpiar la tabla

  banks.forEach(bank => {
      const row = `
          <tr>
              <td>${bank.name}</td>
              <td>${bank.comisionApertura}%</td>
              <td>${bank.tasaInteres}%</td>
              <td>${bank.cat}%</td>
              <td>$${bank.monthlyPayment.toFixed(2)}</td>
          </tr>
      `;
      resultsTable.innerHTML += row;
  });
}

// Evento al enviar el formulario
loanForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Obtener el monto y el plazo
  const amount = parseFloat(document.getElementById('amount').value);
  const months = parseInt(document.querySelector('input[name="months"]:checked').value);

  console.log(`Monto ingresado: ${amount}`);
  console.log(`Plazo seleccionado: ${months} meses`);

  if (amount > 0 && months > 0) {
      // Cargar bancos y hacer el cálculo
      loadBanksAndCalculate(amount, months);
  } else {
      alert('Por favor ingresa un monto y selecciona un plazo válido.');
  }
});