import { db } from '../data/firebase.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Referencias a los elementos del DOM
const loanForm = document.getElementById('loan-form');
const resultsTable = document.getElementById('banks-results');


// Función para calcular el pago mensual aproximado
// Función para calcular el pago mensual aproximado
function calculateMonthlyPayment(monto, plazo, tasaInteres, comisionApertura) {
  const interesMensual = tasaInteres / 100 / 12;  // Convertir la tasa de interés anual a mensual
  const pagoMensual = (monto * interesMensual) / (1 - Math.pow(1 + interesMensual, -plazo));

  // Añadir la comisión de apertura (si la hay)
  const comision = (comisionApertura / 100) * monto;

  return parseFloat((pagoMensual + comision / plazo).toFixed(2));  // Redondear a 2 decimales
}
/*
if (comisionApertura === 0) {
  return tasaInteres.toFixed(2);  // El CAT es igual a la tasa de interés
}*/

// Función para calcular el CAT usando la fórmula correcta
function calculateCAT(monto, plazo, pagoMensual, tasaInteres, comisionApertura) {
  if (comisionApertura === 0){
    return tasaInteres.toFixed(2);
  }
  // Calcula la comisión de apertura en términos absolutos
  const comision = (comisionApertura / 100) * monto; // Calculamos la comisión aquí

  // Calcular el monto total a pagar: la suma de todos los pagos mensuales más la comisión de apertura
  const montoTotalAPagar = (pagoMensual * plazo) + comision;  // Sumamos la comisión al total de pagos
  console.log(`Monto Total a Pagar (incluyendo comisión): ${montoTotalAPagar}`);

  // Usamos la fórmula del CAT anualizado correctamente
  const cat = Math.pow((montoTotalAPagar / monto), (12 / plazo)) - 1;

  // Mostrar el CAT calculado en la consola
  console.log(`CAT Calculado: ${(cat * 100).toFixed(2)}%`);

  // Convertir el resultado a porcentaje y redondearlo
  return (cat * 100).toFixed(2);  
}
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

          // Loguear los datos que estamos obteniendo de Firebase para verificar
          console.log(`Banco: ${bankData.name}`);
          console.log(`Tasa de interés: ${tasaInteres}%`);
          console.log(`Comisión de apertura: ${comisionApertura}%`);

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