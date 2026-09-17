let autocompleteOrigem, autocompleteDestino;

// Inicializa o autocompletar do Google Maps
window.onload = function() {
  const inputOrigem = document.getElementById('origem');
  const inputDestino = document.getElementById('destino');

  if (inputOrigem && inputDestino) {
    autocompleteOrigem = new google.maps.places.Autocomplete(inputOrigem);
    autocompleteDestino = new google.maps.places.Autocomplete(inputDestino);
  }
};

async function processarCorrida() {
  const enderecoOrigem = document.getElementById('origem').value.trim();
  const enderecoDestino = document.getElementById('destino').value.trim();
  const btnCalcular = document.getElementById('btn-calcular');

  if (!enderecoOrigem || !enderecoDestino) {
    alert("Por favor, preencha a origem e o destino!");
    return;
  }

  btnCalcular.innerText = "Calculando rota...";
  btnCalcular.disabled = true;

  // 1. Pede a distância ao Google Maps
  const service = new google.maps.DistanceMatrixService();
  
  service.getDistanceMatrix({
    origins: [enderecoOrigem],
    destinations: [enderecoDestino],
    travelMode: 'DRIVING'
  }, async (response, status) => {
    
    btnCalcular.innerText = "Calcular Valor";
    btnCalcular.disabled = false;

    if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
      const elemento = response.rows[0].elements[0];
      const distanciaMetros = elemento.distance.value;
      const distanciaKM = distanciaMetros / 1000;

      // 2. Envia a distância em KM para a sua API no Firebase
      await obterPrecoDaAPI(distanciaKM);

    } else {
      alert("Não foi possível calcular a rota entre os endereços.");
    }
  });
}

async function obterPrecoDaAPI(km) {
  // URL exata gerada no seu Firebase
  const URL_API_FIREBASE = "https://us-central1-calculadora-corridas.cloudfunctions.net/calcularPrecoCorrida";

  try {
    const resposta = await fetch(URL_API_FIREBASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        distancia_km: km
      })
    });

    if (!resposta.ok) {
      throw new Error(`Erro na requisição: ${resposta.status}`);
    }

    const dados = await resposta.json();

    if (dados.sucesso) {
      document.getElementById('res-distancia').innerText = dados.distancia_km.toFixed(1);
      document.getElementById('res-preco').innerText = dados.preco_final.toFixed(2);
      document.getElementById('resultado').classList.remove('hidden');
    } else {
      alert("Erro no cálculo: " + (dados.erro || "Falha ao processar."));
    }

  } catch (error) {
    console.error("Erro ao chamar a API:", error);
    alert("Falha ao comunicar com o servidor de cálculo.");
  }
}