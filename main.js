// main.js

// Función para cargar contenido de un archivo HTML en un elemento
// Utiliza una promesa para asegurar que la carga se complete
function loadHTML(elementId, filePath) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    const element = document.getElementById(elementId);
                    if (element) {
                        element.innerHTML = this.responseText;
                        resolve();
                    } else {
                        console.error(`Error: No se encontró el elemento con ID '${elementId}'.`);
                        reject();
                    }
                } else {
                    console.error(`Error al cargar el archivo en la ruta: ${filePath}. Estado HTTP: ${this.status}`);
                    reject();
                }
            }
        };
        xhr.open("GET", filePath, true);
        xhr.send();
    });
}

// -----------------------------------------------------------
// Lógica principal de la aplicación
// Espera a que el DOM esté completamente cargado para iniciar todo
// -----------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    // Cargar Header y Footer primero de forma asíncrona
    Promise.all([
        loadHTML('header-placeholder', '../header.html'),
        loadHTML('footer-placeholder', '../footer.html')
    ]).then(() => {
        // La lógica para el selector de años y gráficos va aquí dentro
        // para garantizar que los elementos existan.
        const yearSelector = document.getElementById('yearSelector');
        const graphContainer = document.getElementById('graphContainer');
        const associatedWordsDisplay = document.getElementById('associatedWordsDisplay');
        const loadedIframes = {};

        // Función para cargar el grafo de un año
        function loadGraph() {
            const selectedYear = yearSelector.value;
            const selectedOption = yearSelector.options[yearSelector.selectedIndex];
            const graphUrl = selectedOption ? selectedOption.dataset.graph : null;
            associatedWordsDisplay.innerHTML = '<p>Haz clic en un nodo para ver sus palabras vecinas.</p>';
            if (graphUrl) {
                if (loadedIframes[selectedYear]) {
                    graphContainer.innerHTML = '';
                    graphContainer.appendChild(loadedIframes[selectedYear]);
                    console.log(`Mostrando grafo cacheado para el año: ${selectedYear}`);
                    setTimeout(() => { 
                        const network = loadedIframes[selectedYear].contentWindow.network;
                        if (network) {
                            attachNodeClickListener(network);
                        } else {
                            console.warn("DEBUG: No se pudo re-adjuntar listener para grafo cacheado.");
                        }
                    }, 100);
                } else {
                    const iframe = document.createElement('iframe');
                    iframe.src = graphUrl;
                    iframe.style.width = '100%';
                    iframe.style.height = '700px';
                    iframe.style.border = 'none';
                    iframe.onload = function() {
                        console.log(`Grafo para el año ${selectedYear} cargado.`);
                        setTimeout(() => {
                            const network = iframe.contentWindow.network;
                            if (network) {
                                attachNodeClickListener(network);
                            } else {
                                console.error("DEBUG: Instancia 'network' no disponible en iframe.onload.");
                            }
                        }, 100);
                    };
                    loadedIframes[selectedYear] = iframe;
                    graphContainer.innerHTML = '';
                    graphContainer.appendChild(iframe);
                }
            } else {
                graphContainer.innerHTML = '<p>Selecciona un año para ver el grafo.</p>';
                associatedWordsDisplay.innerHTML = '';
            }
        }

        // Función para adjuntar el "listener" de clic en los nodos
        function attachNodeClickListener(networkInstance) { 
            if (!networkInstance || typeof networkInstance.on !== 'function') { 
                console.error("DEBUG: La instancia de la red no es válida.");
                return;
            }
            
            networkInstance.on("selectNode", function (params) { 
                if (params.nodes.length > 0) {
                    const nodeId = params.nodes[0];
                    const nodeData = networkInstance.body.data.nodes.get(nodeId); 
                    const words = nodeData.associated_words; 
                    
                    if (words) {
                        const wordsArray = words.split(', ').filter(word => word.trim() !== '');
                        if (wordsArray.length > 0) {
                            // --- MODIFICACIÓN CLAVE AQUÍ ---
                            // En lugar de una lista, unimos el array con ", "
                            const formattedString = wordsArray.join(', ');

                            associatedWordsDisplay.innerHTML = `
                                <h3>Palabras vecinas de "${nodeId}":</h3>
                                <p>${formattedString}</p>
                            `;
                        } else {
                            associatedWordsDisplay.innerHTML = `<p>No hay palabras vecinas para "${nodeId}".</p>`;
                        }
                    } else {
                        associatedWordsDisplay.innerHTML = `<p>No hay palabras vecinas para "${nodeId}".</p>`;
                    }
                } else {
                    associatedWordsDisplay.innerHTML = '<p>Haz clic en un nodo para ver sus palabras vecinas.</p>';
                }
            });

    networkInstance.on("click", function(params) {
        if (params.nodes.length === 0 && params.edges.length === 0) {
            associatedWordsDisplay.innerHTML = '<p>Haz clic en un nodo para ver sus palabras vecinas.</p>';
        }
    });
}

        // Añade el listener para el cambio en el selector de año
        if (yearSelector) {
            yearSelector.addEventListener('change', loadGraph);
            // Carga el grafo inicial si hay un año seleccionado
            if (yearSelector.value) {
                loadGraph();
            } else if (yearSelector.options.length > 1) {
                yearSelector.value = yearSelector.options[1].value;
                loadGraph();
            }
        }
    });
});