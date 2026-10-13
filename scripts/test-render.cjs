const http = require('http');

fetch('http://localhost:3000/admin/network/1/content/hero-slider', {
  headers: {
    cookie: 'session=eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjAxMzQxYzNiLWU5MTktNDI0ZC05NTRlLWQ4MTcwMmFjYThhMiIsImVtYWlsIjoic3VwZXJhZG1pbkBkaXNrb21pbmZvLmdvLmlkIiwibmFtZSI6IlN1cGVyIEFkbWluIiwicm9sZSI6InN1cGVyLWFkbWluIiwiaWF0IjoxNzkxODU3OTMyLCJleHAiOjE3OTI0NjI3MzJ9.RAhzeXrdhgGu9NJffl17MEANPmkwBKx7rpk-ySXYsxE'
  }
}).then(async r => {
  console.log('Status:', r.status);
  const html = await r.text();
  console.log('HTML length:', html.length);
  // Let's print out the top structure up to <main>
  const mainIdx = html.indexOf('<main');
  console.log('Top structure:');
  console.log(html.substring(0, mainIdx + 100));
}).catch(e => console.error(e));
