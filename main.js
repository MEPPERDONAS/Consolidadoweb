// Función para cargar contenido de un archivo HTML en un elemento
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
                        reject(new Error(`Element with ID '${elementId}' not found.`));
                    }
                } else {
                    console.error(`Error al cargar el archivo en la ruta: ${filePath}. Estado HTTP: ${this.status}`);
                    reject(new Error(`Failed to load file at path: ${filePath}`));
                }
            }
        };
        xhr.open("GET", filePath, true);
        xhr.send();
    });
}

// Función para resaltar el enlace de navegación activo
function highlightActiveNav() {
    // Obtiene la ruta de la página actual (ej: "/NAL/index.html")
    const currentPathname = window.location.pathname;
    
    // Selecciona todos los botones de navegación QUE YA FUERON CARGADOS
    const navButtons = document.querySelectorAll('#header-placeholder .nav-button');

    let pageMatched = false;

    navButtons.forEach(button => {
        // button.pathname obtiene la ruta resuelta del enlace (ej: "/NAL/index.html")
        // Esto compara la ruta del enlace con la ruta de la ventana
        if (button.pathname === currentPathname) {
            button.classList.add('active-link');
            pageMatched = true; // Marcamos que encontramos la página de subsección
        }
    });

    // CASO ESPECIAL: Si ninguna ruta coincidió Y estamos en la raíz (como "/" o "/index.html")
    // Debemos resaltar el botón "Inicio".
    if (!pageMatched && (currentPathname === '/' || currentPathname.endsWith('/index.html'))) {
        navButtons.forEach(button => {
            // Buscamos el botón "Inicio" específico por su href que vimos en tu imagen
            if (button.getAttribute('href') === '../index.html') {
                button.classList.add('active-link');
            }
        });
    }
}

// -----------------------------------------------------------
// Lógica principal de la aplicación
// -----------------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    let yearTexts = {}; // Declaramos la variable para los textos de los años

    // Promesa para cargar los textos de los años desde el JSON
    const fetchTextsPromise = fetch('texts.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar texts.json');
            }
            return response.json();
        })
        .then(data => {
            yearTexts = data;
        })
        .catch(error => {
            console.error('Error al cargar los textos del JSON:', error);
        });

    // Cargar todos los elementos de la página de forma asíncrona y simultánea
    Promise.all([
        loadHTML('header-placeholder', '../header.html'),
        loadHTML('footer-placeholder', '../footer.html'),

        fetchTextsPromise
    ]).then(() => {
        const yearSelector = document.getElementById('yearSelector');
        const graphContainer = document.getElementById('graphContainer');
        const associatedWordsDisplay = document.getElementById('associatedWordsDisplay');
        const textContainer = document.getElementById('text-container');
        const loadedIframes = {};

        // Función para cargar el grafo de un año
        function loadGraph() {
            const selectedYear = yearSelector.value;
            const selectedOption = yearSelector.options[yearSelector.selectedIndex];
            const graphUrl = selectedOption ? selectedOption.dataset.graph : null;

            // --- INICIO MODIFICACIÓN TEXTO (de la vez anterior) ---
            let newTextContent = '<p>Selecciona un año para ver los detalles.</p>'; 
            if (selectedYear && yearTexts[selectedYear]) {
                newTextContent = `<p>${yearTexts[selectedYear]}</p>`;
            }
            textContainer.classList.add('loading');
            
            // --- INICIO MODIFICACIÓN GRAFO (NUEVO) ---
            // 1. Añade .loading al contenedor del grafo INMEDIATAMENTE.
            //    Esto hace que el grafo ANTIGUO se deslice hacia la izquierda y desaparezca.
            graphContainer.classList.add('loading');
            // --- FIN MODIFICACIÓN GRAFO ---


            // La animación del texto se ejecuta en su propio temporizador
            setTimeout(() => {
                textContainer.innerHTML = newTextContent;
                textContainer.classList.remove('loading');
            }, 300); 


            // Limpia el panel de palabras asociadas
            associatedWordsDisplay.innerHTML = '<p>Haz clic en un nodo para ver sus palabras vecinas.</p>';


            // Lógica de carga del Grafo (MODIFICADA)
            if (graphUrl) {
                if (loadedIframes[selectedYear]) {
                    // --- LÓGICA DE GRAFO CACHEADO ---
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

                    // 2A. Como el grafo está cacheado (ya cargó), podemos animar la entrada casi de inmediato.
                    //     Usamos un pequeño timeout solo para asegurar que el DOM se actualizó.
                    setTimeout(() => {
                        graphContainer.classList.remove('loading');
                    }, 50); // Un retraso muy corto

                } else {
                    // --- LÓGICA DE GRAFO NUEVO ---
                    const iframe = document.createElement('iframe');
                    iframe.src = graphUrl;
                    iframe.style.width = '100%';
                    iframe.style.height = '700px';
                    iframe.style.border = 'none';
                    
                    // 2B. ESTA ES LA CLAVE: El evento 'onload' se dispara CUANDO el iframe nuevo está listo.
                    iframe.onload = function() {
                        console.log(`Grafo para el año ${selectedYear} cargado.`);
                        
                        // 3. AHORA quitamos la clase 'loading' para activar la animación 
                        //    de "deslizar desde la izquierda" (translateX -100px a 0).
                        graphContainer.classList.remove('loading');

                        // (Tu lógica original para adjuntar el listener)
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
                // --- LÓGICA SI NO HAY GRAFO ---
                graphContainer.innerHTML = '<p>Selecciona un año para ver el grafo.</p>';
                
                // 2C. Si no hay grafo, solo animamos el texto placeholder 
                //     para que entre al mismo tiempo que el panel de texto principal.
                setTimeout(() => {
                    graphContainer.classList.remove('loading');
                }, 300); // Sincronizado con la animación del texto.
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
                            const formattedString = wordsArray.join(', ');
                            associatedWordsDisplay.innerHTML = `<h3>Palabras vecinas de "${nodeId}":</h3><p>${formattedString}</p>`;
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

        if (yearSelector) {
            yearSelector.addEventListener('change', loadGraph);
            if (yearSelector.value) {
                loadGraph();
            } else if (yearSelector.options.length > 1) {
                yearSelector.value = yearSelector.options[1].value;
                loadGraph();
            }
        }
    highlightActiveNav();    
    });
});