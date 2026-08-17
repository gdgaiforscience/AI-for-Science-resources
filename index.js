import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.0';

env.allowLocalModels = false;

const resourcesContainer = document.querySelector("#resourcesContainer");
const domainFilters = document.querySelectorAll("#domain-filters .btnFilter");
const typeFilters = document.querySelectorAll("#type-filters .btnFilter");
const searchInput = document.querySelector("#searchInput");
const searchStatus = document.querySelector("#searchStatus");

let selectedDomain = null;
let selectedType = null;
let searchQuery = "";
let extractor = null;
let searchDebounceTimeout = null;

// Compute cosine similarity between two 1D arrays
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Function to generate embedding
async function generateEmbedding(text) {
  if (!extractor) return null;
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Load model and generate embeddings for all resources
async function initializeSemanticSearch() {
  try {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    // Generate embeddings for resources
    searchStatus.textContent = "Processing resource data...";
    for (let resource of dataResources) {
      const textToEmbed = `${resource.title} ${resource.description} ${resource.tags.join(' ')}`;
      resource.embedding = await generateEmbedding(textToEmbed);
    }
    
    searchInput.disabled = false;
    searchStatus.textContent = "Semantic search is ready!";
    setTimeout(() => { searchStatus.style.display = 'none'; }, 3000);
  } catch (error) {
    console.error("Error initializing semantic search:", error);
    searchStatus.textContent = "Failed to load semantic search.";
  }
}

// Render resources
async function renderResources() {
  resourcesContainer.innerHTML = "";
  
  let queryEmbedding = null;
  if (searchQuery.trim() !== "" && extractor) {
    queryEmbedding = await generateEmbedding(searchQuery);
  }

  let resourcesToDisplay = dataResources.map(resource => {
    let score = 0;
    if (queryEmbedding && resource.embedding) {
      score = cosineSimilarity(queryEmbedding, resource.embedding);
    }
    return { ...resource, score };
  });

  resourcesToDisplay = resourcesToDisplay.filter((resourceData) => {
    const domainMatch = selectedDomain
      ? resourceData.tags.includes(selectedDomain)
      : true;
    const typeMatch = selectedType
      ? resourceData.tags.includes(selectedType)
      : true;
      
    // If there is a search query, filter out items with low similarity score
    const searchMatch = queryEmbedding ? resourceData.score > 0.5 : true;
    
    return domainMatch && typeMatch && searchMatch;
  });

  if (queryEmbedding) {
    // Sort by similarity score descending
    resourcesToDisplay.sort((a, b) => b.score - a.score);
  } else {
    // Original sort logic
    resourcesToDisplay.sort((a, b) => a.link.localeCompare(b.link));
  }
  
  resourcesToDisplay.forEach((resource) => {
    const card = document.createElement('a');
    card.href = resource.link;
    card.className = 'card';
    card.target = '_blank';

    const header = document.createElement('div');
    header.className = 'card-header';
    
    const icon = document.createElement('img');
    const hostname = new URL(resource.link).hostname;
    icon.src = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
    icon.alt = resource.title.replace(/\[.*?\]/g, '').trim() + ' icon';
    icon.className = 'card-icon';

    const title = document.createElement('h2');
    title.className = 'card-title';
    title.textContent = resource.title;

    header.appendChild(icon);
    header.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'card-desc';
    desc.textContent = resource.description;

    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'card-tags';
    resource.tags.forEach(tagText => {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = tagText;
      tagsContainer.appendChild(tag);
    });

    card.appendChild(header);
    card.appendChild(desc);
    card.appendChild(tagsContainer);

    resourcesContainer.appendChild(card);
  });
}

// Event Listeners
domainFilters.forEach(btn => {
    btn.addEventListener("click", function() {
        const tag = this.id;
        if (selectedDomain === tag) {
            selectedDomain = null;
            this.classList.remove('selected');
        } else {
            domainFilters.forEach(b => b.classList.remove('selected'));
            selectedDomain = tag;
            this.classList.add('selected');
        }
        renderResources();
    });
});

typeFilters.forEach(btn => {
    btn.addEventListener("click", function() {
        const tag = this.id;
        if (selectedType === tag) {
            selectedType = null;
            this.classList.remove('selected');
        } else {
            typeFilters.forEach(b => b.classList.remove('selected'));
            selectedType = tag;
            this.classList.add('selected');
        }
        renderResources();
    });
});

searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => {
        renderResources();
    }, 300); // 300ms debounce
});

// Initial Render
renderResources();

// Initialize Semantic Search
initializeSemanticSearch();
