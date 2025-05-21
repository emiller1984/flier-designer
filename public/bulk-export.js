document.addEventListener('DOMContentLoaded', () => {
  const communityList = document.getElementById('community-list');
  const templateList = document.getElementById('template-list');
  const summary = document.getElementById('export-summary');

  let selectedCommunities = new Set();
  let selectedTemplates = new Set();

  function updateSummary() {
    const total = selectedCommunities.size * selectedTemplates.size;
    summary.textContent = `Selected Communities: ${selectedCommunities.size} | Selected Templates: ${selectedTemplates.size} | PDFs to Generate: ${total}`;
  }

  function createCheckbox(id, label, container, set) {
    const wrapper = document.createElement('label');
    wrapper.style.display = 'block';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.value = id;
    box.checked = true;
    box.addEventListener('change', () => {
      if (box.checked) {
        set.add(id);
      } else {
        set.delete(id);
      }
      updateSummary();
    });
    wrapper.appendChild(box);
    wrapper.append(` ${label}`);
    container.appendChild(wrapper);
    set.add(id);
  }

  function loadCSV(path, handler) {
    fetch(path)
      .then(res => res.text())
      .then(text => {
        const lines = text.trim().split('\n');
        const rows = lines.slice(1).map(line => line.split(','));
        handler(rows);
      })
      .catch(err => console.error(`Error loading ${path}:`, err));
  }

  // Load communities
  loadCSV('/data/communities.csv', rows => {
    rows.forEach(([id, alias, code]) => {
      const label = `${alias} (ID: ${id})`;
      createCheckbox(id, label, communityList, selectedCommunities);
    });
    updateSummary();
  });

  // Load templates
  loadCSV('/templates/templates.csv', rows => {
    rows.forEach(([url]) => {
      const label = url.split('/').pop();
      createCheckbox(url, label, templateList, selectedTemplates);
    });
    updateSummary();
  });

  // Select/Deselect All for communities
  document.getElementById('select-all-communities').addEventListener('click', () => {
    communityList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = true;
      selectedCommunities.add(cb.value);
    });
    updateSummary();
  });

  document.getElementById('deselect-all-communities').addEventListener('click', () => {
    communityList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = false;
      selectedCommunities.delete(cb.value);
    });
    updateSummary();
  });

  // Add Template by URL
  document.getElementById('add-template-url').addEventListener('click', () => {
    const input = document.getElementById('template-url');
    const url = input.value.trim();
    if (!url) return alert('Please enter a URL.');
    fetch('/api/add-template-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to add template URL');
      return res.json();
    })
    .then(() => {
      input.value = '';
      templateList.innerHTML = '';
      selectedTemplates.clear();
      loadCSV('/templates/templates.csv', rows => {
        rows.forEach(([url]) => {
          const label = url.split('/').pop();
          createCheckbox(url, label, templateList, selectedTemplates);
        });
        updateSummary();
      });
    })
    .catch(err => {
      console.error(err);
      alert('Error adding template URL');
    });
  });
  // Upload Template Image
  document.getElementById('template-upload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('template', file);

    fetch('/api/upload-template', {
      method: 'POST',
      body: formData
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to upload template');
      return res.json();
    })
    .then(() => {
      event.target.value = '';
      templateList.innerHTML = '';
      selectedTemplates.clear();
      loadCSV('/templates/templates.csv', rows => {
        rows.forEach(([url]) => {
          const label = url.split('/').pop();
          createCheckbox(url, label, templateList, selectedTemplates);
        });
        updateSummary();
      });
    })
    .catch(err => {
      console.error(err);
      alert('Error uploading template image');
    });
  });

  document.getElementById('generate-pdfs').addEventListener('click', () => {
    if (selectedCommunities.size === 0 || selectedTemplates.size === 0) {
      return alert('Please select at least one community and one template.');
    }

    const allCombos = [];
    Array.from(selectedCommunities).forEach(community => {
      Array.from(selectedTemplates).forEach(template => {
        allCombos.push({ community, template });
      });
    });

    const batchSize = 20;
    const batches = [];
    for (let i = 0; i < allCombos.length; i += batchSize) {
      batches.push(allCombos.slice(i, i + batchSize));
    }

    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'batch-results';
    resultsDiv.innerHTML = '<h3>Export Results</h3>';
    document.body.appendChild(resultsDiv);

    const processBatch = (index) => {
      if (index >= batches.length) return;

      const batch = batches[index];
      const payload = {
        communities: [...new Set(batch.map(c => c.community))],
        templates: [...new Set(batch.map(c => c.template))]
      };

      const status = document.createElement('p');
      status.textContent = `⏳ Processing batch ${index + 1}...`;
      resultsDiv.appendChild(status);

      fetch('/api/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error('Failed to generate batch');
        return res.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `batch-${index + 1}.zip`;
        link.textContent = `Download Batch ${index + 1} (${batch.length} PDFs)`;
        const entry = document.createElement('p');
        entry.textContent = '✔ ';
        entry.appendChild(link);
        resultsDiv.replaceChild(entry, status);
        processBatch(index + 1);
      })
      .catch(err => {
        console.error(err);
        status.textContent = `❌ Failed batch ${index + 1}`;
        processBatch(index + 1);
      });
    };

    resultsDiv.innerHTML += `<p>Processing ${batches.length} batches total...</p>`;
    processBatch(0);
  });
});