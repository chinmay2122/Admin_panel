const fs = require('fs');
const path = require('path');

const files = [
  'app/admin/(dashboard)/users/UsersClient.tsx',
  'app/admin/(dashboard)/creators/CreatorsClient.tsx',
  'app/admin/(dashboard)/collectors/CollectorsClient.tsx',
  'app/admin/(dashboard)/artworks/ArtworksClient.tsx',
  'app/admin/(dashboard)/reports/ReportsClient.tsx',
  'app/admin/(dashboard)/cor/members/CorMembersClient.tsx',
  'app/admin/(dashboard)/cor/requests/CorRequestsClient.tsx',
  'app/admin/(dashboard)/cor/opportunities/CorOpportunitiesClient.tsx',
  'app/admin/(dashboard)/cor/applications/CorApplicationsClient.tsx'
];

const typeMapping = {
  'UsersClient.tsx': 'users',
  'CreatorsClient.tsx': 'creators',
  'CollectorsClient.tsx': 'collectors',
  'ArtworksClient.tsx': 'artworks',
  'ReportsClient.tsx': 'reports',
  'CorMembersClient.tsx': 'cor-members',
  'CorRequestsClient.tsx': 'cor-requests',
  'CorOpportunitiesClient.tsx': 'cor-opportunities',
  'CorApplicationsClient.tsx': 'cor-applications'
};

const filterMapping = {
  'UsersClient.tsx': '{ query: debouncedSearch, role: activeTab === "all" ? undefined : activeTab }',
  'CreatorsClient.tsx': '{ query: debouncedSearch, status: activeTab === "all" ? undefined : activeTab }',
  'CollectorsClient.tsx': '{ query: debouncedSearch, status: activeTab === "all" ? undefined : activeTab }',
  'ArtworksClient.tsx': '{ query: debouncedSearch, status: activeTab === "all" ? undefined : activeTab, creatorName: creatorFilter }',
  'ReportsClient.tsx': '{ query: debouncedSearch, status: activeTab === "all" ? undefined : activeTab }',
  'CorMembersClient.tsx': '{ query: debouncedSearch, status: activeTab === "all" ? undefined : activeTab }',
  'CorRequestsClient.tsx': '{ query: debouncedSearch, status: activeTab === "all" ? undefined : activeTab }',
  'CorOpportunitiesClient.tsx': '{ query: debouncedSearch, status: activeTab === "all" ? undefined : activeTab }',
  'CorApplicationsClient.tsx': '{ query: debouncedSearch, status: activeTab === "all" ? undefined : activeTab }'
};

files.forEach(f => {
  const p = path.join(__dirname, f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf-8');
    
    // Replace <ExportDropdown ... /> with new props
    const regex = /<ExportDropdown[\s\S]*?\/>/g;
    
    const basename = path.basename(f);
    const type = typeMapping[basename];
    const filters = filterMapping[basename];

    content = content.replace(regex, `<ExportDropdown exportType="${type}" filters={${filters}} />`);

    fs.writeFileSync(p, content);
    console.log('Updated ' + f);
  } else {
    console.log('Not found ' + f);
  }
});
