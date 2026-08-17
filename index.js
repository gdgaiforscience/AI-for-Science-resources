const resourcesContainer = document.querySelector("#resourcesContainer");
const domainFilters = document.querySelectorAll("#domain-filters .btnFilter");
const typeFilters = document.querySelectorAll("#type-filters .btnFilter");

let selectedDomain = null;
let selectedType = null;

function renderResources() {
  resourcesContainer.innerHTML = "";

  let resourcesToDisplay = dataResources.filter((resourceData) => {
    const domainMatch = selectedDomain
      ? resourceData.tags.includes(selectedDomain)
      : true;
    const typeMatch = selectedType
      ? resourceData.tags.includes(selectedType)
      : true;
    return domainMatch && typeMatch;
  });

  resourcesToDisplay.sort((a, b) => a.link.localeCompare(b.link));
  
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

renderResources();
