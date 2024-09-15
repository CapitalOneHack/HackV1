// Capturar el clic en el botón de "Más detalles"
document.addEventListener('click', function(event) {
  if (event.target && event.target.classList.contains('btn-danger')) {
    // Obtener el índice del banco desde el data attribute
    const bankIndex = event.target.getAttribute('data-bank');

    // Obtener los detalles del banco a partir del índice
    const bank = banks[bankIndex];  // "banks" es el array donde están todos los datos

    // Ocultar la sección de tarjetas
    document.getElementById('results').style.display = 'none';

    // Mostrar la sección de detalles
    const detailsSection = document.getElementById('details-section');
    detailsSection.style.display = 'block';

    // Inyectar la información del banco en la sección de detalles
    detailsSection.innerHTML = `
      <button class="btn btn-link" id="back-button">Regresar</button>
      <h2>${bank.name}</h2>
      <p>Monto solicitado: $10,000</p>
      <p>Pago periódico: ${bank.monthlyPayment}</p>
      <p>Monto total a pagar: $24,447.05 MXN</p>
      <p>Tasa de interés anual: ${bank.tasaInteres}%</p>
      <p>CAT: ${bank.cat}%</p>
    `;

    // Funcionalidad para volver a la vista de tarjetas
    document.getElementById('back-button').addEventListener('click', function() {
      document.getElementById('results').style.display = 'block';  // Mostrar de nuevo las tarjetas
      detailsSection.style.display = 'none';  // Ocultar la sección de detalles
    });
  }
});
