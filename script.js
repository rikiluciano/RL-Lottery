const tabla = document.getElementById('tabla-numeros');

// Crear la tabla
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

// CONFIG JSONBIN
const binId = '67fc06fa8960c979a5844eda';
const masterKey = '$2a$10$R47nF8Jwysp8tum8vhlkAOq/QNQz2Y7zY3UnvE5qEfAFuQDIQHhs6';
const accessKey = '$2a$10$NV5uk0VSWvnyVwTRSo228exXdxhD5YHsAmpQDB3z.jZec0yH2ckam';
const rssFeedUrl = 'https://enloteria.com/rss';

// Mostrar conteo en la tabla
function mostrarConteo(conteo) {
  for (let i = 0; i < 100; i++) {
    const numero = i.toString().padStart(2, '0');
    const celda = document.getElementById(numero);
    const cantidad = conteo[numero] || 0;
    celda.textContent = cantidad > 0 ? cantidad : '';
  }
}

// Cargar datos desde JSONBin
async function cargarDesdeBin() {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
      headers: {
        'X-Master-Key': masterKey,
        'X-Access-Key': accessKey
      }
    });
    if (!res.ok) throw new Error('No se pudo cargar el bin');
    const data = await res.json();
    return data.record;
  } catch (error) {
    console.error('Error al cargar bin:', error);
    return null;
  }
}

// Guardar en JSONBin
async function guardarEnBin(data) {
  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': masterKey,
        'X-Access-Key': accessKey
      },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    console.log('Datos actualizados en JSONBin:', result);
  } catch (error) {
    console.error('Error al guardar en bin:', error);
  }
}

// Procesar RSS y actualizar JSONBin
async function procesarYActualizar() {
  const estructura = await cargarDesdeBin();
  if (!estructura) return;
  
  const conteo = estructura.conteo || {};
  const itemsProcesados = estructura.itemsProcesados || [];
  
  try {
    const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent(rssFeedUrl));
    const data = await res.json();
    const xml = new DOMParser().parseFromString(data.contents, 'text/xml');
    const items = xml.querySelectorAll('item');
    
    let seActualizo = false;
    
    items.forEach(item => {
      const title = item.querySelector('title')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      
      if (!title.toLowerCase().includes('hoy:') || !pubDate) return;
      if (itemsProcesados.includes(pubDate)) return;
      
      const match = title.match(/hoy[:\s]*([\d]{2})[-,\s]+([\d]{2})[-,\s]+([\d]{2})/i);
      if (!match) return;
      
      const numeros = match.slice(1); // [num1, num2, num3]
      numeros.forEach(num => {
        conteo[num] = (conteo[num] || 0) + 1;
      });
      
      itemsProcesados.push(pubDate);
      seActualizo = true;
    });
    
    if (seActualizo) {
      await guardarEnBin({ conteo, itemsProcesados });
    }
    
    mostrarConteo(conteo);
  } catch (error) {
    console.error('Error al procesar RSS:', error);
  }
}

// INICIO
procesarYActualizar();