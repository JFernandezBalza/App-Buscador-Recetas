// ===============================================
// Descripción: Lógica principal para el Buscador de Recetas
// Desarrollador: Joser Fernández
// ===============================================

// SECCIÓN 1: Declaración de Variables y Elementos del DOM
// Aquí declaramos todas las constantes y variables que referencian
// elementos de nuestro HTML o que son globales a la aplicación.

const recipeInput = document.getElementById('recipe-input');
const searchButton = document.getElementById('search-button');
const statusMessage = document.getElementById('status-message');
const recipeList = document.getElementById('recipe-list');
const recipeDetailSection = document.getElementById('recipe-detail-section');
const recipeDetailContent = document.getElementById('recipe-detail-content');
const closeDetailButton = document.getElementById('close-detail-button');
const noResultsMessage = document.getElementById('no-results-message');

// Referencia al selector de tipo de búsqueda
const searchTypeSelect = document.getElementById('search-type');

// Una variable para almacenar el nombre del desarrollador
const developerName = 'Joser Fernández';

// Constante para la URL base de TheMealDB API
const API_BASE_URL = 'https://www.themealdb.com/api/json/v1/1/'; // URL base de TheMealDB
let currentMealId = null; // Para guardar el ID de la receta que estamos viendo en detalle

// SECCIÓN 2: Funciones Basicas de Utilidad (Helpers)
// Función para mostrar mensajes de estado al usuario
// Estas funciones realizan tareas pequeñas y específicas que pueden ser
// usadas por otras funciones en la aplicación.

/**
 * Muestra un mensaje de estado al usuario en la interfaz.
 * @param {string} message - El texto del mensaje a mostrar.
 * @param {string} type - El tipo de mensaje ('info', 'success', 'warning', 'error') para aplicar estilos CSS.
 */
function displayStatus(message, type = 'info') {
  statusMessage.textContent = message;
  // Podemos añadir clases para estilos específicos de mensaje (éxito, error, etc.)
  statusMessage.className = `status-message ${type}`; // Aplica clases para estilos dinámicos
}

// Función para limpiar la lista de recetas (la usaremos antes de mostrar nuevos resultados)
function clearRecipeList() {
  recipeList.innerHTML = ''; // Vacía el contenido del div de recetas
  noResultsMessage.classList.add('no-results-hidden'); // Oculta el mensaje si hay algo en la lista
}

/**
 * Habilita o deshabilita los controles de búsqueda (input y botón)
 * para evitar interacciones mientras una operación está en curso.
 * @param {boolean} isLoading - True para deshabilitar, False para habilitar.
 */
function toggleSearchState(isLoading) {
  searchButton.disabled = isLoading; // Deshabilita el botón si está cargando
  recipeInput.disabled = isLoading; // Deshabilita el input también
  searchTypeSelect.disabled = isLoading; // Deshabilita también el selector
  // Esto previene múltiples búsquedas o entradas mientras una operación está en curso.
}

// SECCIÓN 3: Funciones de Manipulación del DOM y Renderizado
// Estas funciones se encargan de crear, actualizar o eliminar
// elementos en la interfaz de usuario.

/**
 * Crea un elemento de tarjeta de receta individual para mostrar en la lista.
 * @param {object} recipe - Objeto de receta de la API.
 * @returns {HTMLElement} - El elemento div de la tarjeta de receta.
 */
// Función para crear una tarjeta de receta individual
function createRecipeCard(recipe) {
  // Paso 1: Crear el elemento div principal para la tarjeta
  const card = document.createElement('div');
  card.classList.add('recipe-card'); // Añadir la clase CSS para el estilo
  card.dataset.id = recipe.idMeal; // Almacena el ID para futura referencia

  // Evento para ver el detalle de la receta al hacer clic
  card.addEventListener('click', () => {
    getRecipeDetails(recipe.idMeal); // Llama a la nueva función para obtener detalles
  });

  // Paso 2: Crear el elemento de la imagen
  const img = document.createElement('img');
  img.src = recipe.strMealThumb; // La URL de la imagen
  img.alt = recipe.strMeal; // Texto alternativo para accesibilidad

  // Paso 3: Crear el elemento del título de la receta
  const title = document.createElement('h3');
  title.textContent = recipe.strMeal; // El nombre de la receta

  // Paso 4: Crear un párrafo para una breve descripción o categoría
  const category = document.createElement('p');
  // Si buscamos por ingrediente, la categoría y origen no siempre vienen en el resultado inicial
  // Solo mostrar si existen
  if (recipe.strCategory && recipe.strArea) {
    category.textContent = `Categoría: ${recipe.strCategory} - Origen: ${recipe.strArea}`;
  } else {
    category.textContent = ``; // O déjalo vacío
  }
  // Paso 5: Anidar los elementos creados dentro de la tarjeta
  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(category);

  // Paso 6: Devolver la tarjeta completa
  return card;
}

/**
 * Muestra un array de recetas en el contenedor de la lista de recetas.
 * @param {Array<object>} recipes - Un array de objetos de receta.
 */
// Función para mostrar un array de recetas en la lista
function displayRecipes(recipes) {
  clearRecipeList(); // Limpiamos la lista antes de añadir nuevas recetas y esto ocultará el mensaje de "no-results" si previamente estaba visible

  if (!recipes || recipes.length === 0) {
    // Ajuste para manejar casos donde 'meals' es null
    displayStatus(
      'No se encontraron recetas. Intenta con otra búsqueda.',
      'warning'
    );
    noResultsMessage.classList.remove('no-results-hidden'); // Muestra el mensaje si no hay resultados
    noResultsMessage.innerHTML = `
            <img src="https://www.themealdb.com/images/meal-icon.png" alt="Icono de Chef" class="no-results-icon">
            <p>¡Oops! No encontramos ninguna receta con ese término.</p>
            <p>Asegúrate de que la palabra esté bien escrita o prueba con otro término/ingrediente.</p>
        `;
    return;
  }

  recipes.forEach((recipe) => {
    const card = createRecipeCard(recipe); // Creamos la tarjeta para cada receta
    recipeList.appendChild(card); // Añadimos la tarjeta al contenedor de recetas
  });

  displayStatus(`Se encontraron ${recipes.length} recetas.`, 'success'); // Actualizamos el mensaje de estado
  noResultsMessage.classList.add('no-results-hidden'); // Asegura que se oculte si se encontraron resultados
}

/**
 * Renderiza los detalles de una receta específica en la sección de detalle (modal).
 * @param {object} meal - El objeto de la receta con todos sus detalles.
 */
function renderRecipeDetail(meal) {
  const ingredientsList = [];
  // Itera hasta 20 para encontrar todos los ingredientes y sus medidas
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];

    // Añade el ingrediente solo si existe y no está vacío
    if (ingredient && ingredient.trim() !== '') {
      ingredientsList.push(
        `${measure ? measure.trim() + ' ' : ''}${ingredient.trim()}`
      );
    }
  }

  // Construye el HTML del detalle de la receta usando Template Literals
  recipeDetailContent.innerHTML = `
        <h2>${meal.strMeal}</h2>
        <img src="${meal.strMealThumb}" alt="${
    meal.strMeal
  }" class="detail-img">
        <p><strong>Categoría:</strong> ${meal.strCategory || 'N/A'}</p>
        <p><strong>Origen:</strong> ${meal.strArea || 'N/A'}</p>
        <h3>Ingredientes:</h3>
        <ul>
            ${ingredientsList.map((item) => `<li>${item}</li>`).join('')}
        </ul>
        <h3>Instrucciones:</h3>
        <p class="instructions">${meal.strInstructions}</p>
        ${
          meal.strYoutube
            ? `<p><a href="${meal.strYoutube}" target="_blank">Ver video en YouTube</a></p>`
            : ''
        }
    `;
  // El estilo para .detail-img y .instructions ya está en style.css
}

// SECCIÓN 4: Funciones de Interacción con la API
// Estas funciones se encargan de hacer las peticiones a la API externa.

/**
 * Busca recetas por un término de búsqueda dado utilizando la API de TheMealDB.
 * @param {string} searchTerm - El nombre de la receta o ingrediente a buscar.
 */

// Función para que searchRecipes tome el tipo de búsqueda
async function searchRecipes(searchTerm, searchType) {
  toggleSearchState(true); // Deshabilita los controles al iniciar la búsqueda
  displayStatus('Buscando recetas... por favor espera', 'info'); // Mensaje de carga
  clearRecipeList(); // Limpiamos resultados anteriores

  let apiUrl;
  // Decidir qué endpoint de la API usar basado en el searchType
  if (searchType === 'name') {
    apiUrl = `${API_BASE_URL}search.php?s=${searchTerm}`;
  } else if (searchType === 'ingredient') {
    apiUrl = `${API_BASE_URL}filter.php?i=${searchTerm}`;
  } else {
    displayStatus('Tipo de búsqueda no válido.', 'error');
    toggleSearchState(false);
    return;
  }
  try {
    const response = await fetch(apiUrl); // Usamos la URL construida

    if (!response.ok) {
      // Error HTTP: Lanzamos un error con el estado y el texto del estado para más detalle
      throw new Error(
        `Error HTTP: ${response.status} - ${
          response.statusText || 'Error desconocido'
        }`
      );
    }

    const data = await response.json();
    const meals = data.meals; // Los resultados están en la propiedad 'meals'

    if (!meals) {
      // Si la API devuelve 'null' en meals, significa que no hay resultados
      displayStatus(
        `No se encontraron recetas para "${searchTerm}". Por favor, intenta con otro término.`,
        'warning'
      );
      return; // Salir de la función si no hay recetas
    }

    displayRecipes(meals); // Muestra las tarjetas de las recetas obtenidas
  } catch (error) {
    // Captura cualquier error que ocurra en el bloque try (ej. problemas de red, errores HTTP)
    console.error('Error al buscar recetas:', error);
    // Mensaje de error más genérico para el usuario, que se puede mejorar
    displayStatus(
      'Ocurrió un error al buscar recetas. Por favor, verifica tu conexión o inténtalo de nuevo más tarde.',
      'error'
    );
  } finally {
    // El bloque finally se ejecuta SIEMPRE, ya sea que try termine exitosamente o con un error en catch.
    toggleSearchState(false); // Siempre habilita los controles al finalizar la operación
  }
}

/**
 * Obtiene los detalles de una receta específica por su ID.
 * @param {string} mealId - El ID único de la receta.
 */
// Función para obtener detalles de una receta específica por ID
async function getRecipeDetails(mealId) {
  toggleSearchState(true); // Deshabilita los controles mientras se carga el detalle
  displayStatus('Cargando detalles de la receta...', 'info');
  recipeDetailContent.innerHTML = ''; // Limpiamos el detalle anterior
  recipeDetailSection.classList.remove('recipe-detail-hidden'); // Mostramos la sección de detalle/modal

  try {
    const response = await fetch(`${API_BASE_URL}lookup.php?i=${mealId}`);
    if (!response.ok) {
      // Error HTTP en detalles
      throw new Error(
        `Error HTTP: ${response.status} - ${
          response.statusText || 'Error desconocido'
        }`
      );
    }

    const data = await response.json();
    const meal = data.meals[0]; // La API devuelve un array, tomamos el primer elemento

    if (!meal) {
      displayStatus('No se encontraron detalles para esta receta.', 'warning');
      recipeDetailSection.classList.add('recipe-detail-hidden'); // Ocultar el detalle/modal si no hay detalles válidos
      return;
    }

    renderRecipeDetail(meal); // Renderiza los detalles en el modal
    displayStatus('Detalles de la receta cargados.', 'success');
  } catch (error) {
    console.error('Error al obtener detalles de la receta:', error);
    displayStatus(
      'Ocurrió un error al cargar los detalles de la receta. Por favor, inténtalo de nuevo.',
      'error'
    );
    recipeDetailSection.classList.add('recipe-detail-hidden');
  } finally {
    toggleSearchState(false); // Habilita los controles al finalizar
  }
}

// SECCIÓN 5: Inicialización de la Aplicación y Event Listeners
// Esta función es el punto de entrada principal de la aplicación.
// Configura los eventos y el estado inicial.

/**
 * Inicializa la aplicación cuando el DOM está completamente cargado.
 * Configura los event listeners y el mensaje de bienvenida.
 */

// Función de initializeApp para usar las funciones.
function initializeApp() {
  console.log('Aplicación Buscador de Recetas iniciada por:', developerName);

  // Podemos buscar algo por defecto o pedir al usuario que lo haga.
  displayStatus(
    "¡Listo para encontrar tu próxima receta! Prueba buscando 'chicken' o 'pasta'."
  );
  clearRecipeList(); // Asegurarnos que no haya nada en la lista al inicio.
  noResultsMessage.classList.remove('no-results-hidden'); // Muestra el mensaje inicial de bienvenida

  // Evento para el botón de búsqueda
  searchButton.addEventListener('click', () => {
    let searchTerm = recipeInput.value.trim(); // Obtiene y limpia el término de búsqueda
    let searchType = searchTypeSelect.value; // Obtener el valor del selector

    if (searchTerm) {
      searchRecipes(searchTerm, searchType); // Llama a la función de búsqueda por tipo
      console.log('Buscando recetas para:', searchTerm);
    } else {
      displayStatus(
        'Por favor, ingresa un ingrediente o el nombre de una receta.',
        'warning'
      );
      clearRecipeList(); // Limpia si no hay término
    }
  });

  // Evento para cerrar la sección de detalle (modal)
  closeDetailButton.addEventListener('click', () => {
    recipeDetailSection.classList.add('recipe-detail-hidden'); // Oculta el detalle/modal
    recipeDetailContent.innerHTML = ''; // Limpiamos el contenido del detalle/modal
    currentMealId = null; // Resetea el ID de la receta actual
  });

  // Evento para permitir buscar al presionar Enter en el input
  recipeInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      searchButton.click(); // Simula un clic en el botón de búsqueda
    }
  });
}

// PUNTO DE ENTRADA: Ejecutar la función de inicialización
// cuando el DOM esté completamente cargado.

// 3. Ejecutar la función de inicialización cuando el DOM esté completamente cargado.
document.addEventListener('DOMContentLoaded', initializeApp);
