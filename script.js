const tabla = document.getElementById('tabla-numeros');
for (let i = 0; i < 100; i += 10) {
  const thead = document.createElement('thead');
  const filaTh = document.createElement('tr');
  for (let j = i; j < i + 10; j++) {
    const th = document.createElement('th');
    th.align = 'center';
    th.textContent = j.toString().padStart(2, '0');
    filaTh.appendChild(th);
  }
  thead.appendChild(filaTh);
  tabla.appendChild(thead);
  
  const tbody = document.createElement('tbody');
  const filaTd = document.createElement('tr');
  for (let j = i; j < i + 10; j++) {
    const td = document.createElement('td');
    td.id = j.toString().padStart(2, '0');
    td.align = 'center';
    td.innerHTML = '&nbsp;';
    filaTd.appendChild(td);
  }
  tbody.appendChild(filaTd);
  tabla.appendChild(tbody);
}

const rssFeeds = ['https://enloteria.com/rss'];
const binId = '67f869f78561e97a50fd2129';
const masterKey = '$2a$10$R47nF8Jwysp8tum8vhlkAOq/QNQz2Y7zY3UnvE5qEfAFuQDIQHhs6';

function actualizarTabla(conteo) {
  Object.entries(conteo).forEach(([numero, cantidad]) => {
    const celda = document.getElementById(numero);
    if (celda) celda.textContent = cantidad > 0 ? cantidad : '';
  });
}

async function cargarDatosDesdeJSONBin() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: { 'X-Master-Key': masterKey }
    });
    const data = await res.json();
    return data.record || { conteo: {}, itemsProcesados: [] };
  } catch (err) {
    console.error('Error al cargar desde JSONBin:', err);
    return { conteo: {}, itemsProcesados: [] };
  }
}

function guardarDatosEnJSONBin(data) {
  return fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': masterKey,
        'X-Bin-Private': false
      },
      body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(data => console.log('Datos guardados en JSONBin:', data))
    .catch(err => console.error('Error al guardar en JSONBin:', err));
}

function procesarFeed(feedUrl, data) {
  fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(feedUrl))
    .then(res => res.json())
    .then(feedData => {
      const xml = new DOMParser().parseFromString(feedData.contents, 'text/xml');
      const items = xml.querySelectorAll('item');
      
      data.itemsProcesados = data.itemsProcesados || [];
      data.conteo = data.conteo || {};
      
      items.forEach(item => {
        const title = item.querySelector('title')?.textContent;
        const pubDate = item.querySelector('pubDate')?.textContent;
        if (!title || !pubDate || data.itemsProcesados.includes(pubDate)) return;
        
        const numerosMatch = title.match(/hoy:?\s*(\d{2})[-,\s]+(\d{2})[-,\s]+(\d{2})/i);
        if (!numerosMatch) return;
        
        const numeros = numerosMatch.slice(1);
        numeros.forEach(num => {
          data.conteo[num] = (data.conteo[num] || 0) + 1;
        });
        
        data.itemsProcesados.push(pubDate);
      });
      
      actualizarTabla(data.conteo);
      guardarDatosEnJSONBin(data);
    })
    .catch(err => console.error('Error al procesar feed:', err));
}

// Inicializar
cargarDatosDesdeJSONBin().then(data => {
  actualizarTabla(data.conteo || {});
  rssFeeds.forEach(feed => procesarFeed(feed, data));
});

// Lógica del botón de reinicio
document.getElementById('resetButton').addEventListener('click', () => {
  document.getElementById('resetModal').style.display = 'flex';
});

document.getElementById('cancelReset').addEventListener('click', () => {
  document.getElementById('resetModal').style.display = 'none';
});

document.getElementById('confirmReset').addEventListener('click', () => {
  const vacio = {
    conteo: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [i.toString().padStart(2, '0'), 0])),
    itemsProcesados: []
  };
  guardarDatosEnJSONBin(vacio).then(() => location.reload());
});