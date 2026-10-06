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
  'UsersClient.tsx': '{ query: searchQuery, role: activeTab === "all" ? undefined : activeTab }',
  'CreatorsClient.tsx': '{ query: searchQuery, status: selectedStatus === "all" ? undefined : selectedStatus, plan: selectedPlan === "all" ? undefined : selectedPlan }',
  'CollectorsClient.tsx': '{ query: searchQuery, status: selectedStatus === "all" ? undefined : selectedStatus, plan: selectedPlan === "all" ? undefined : selectedPlan }',
  'ArtworksClient.tsx': '{ query: debouncedSearch, status: statusFilter === "all" ? undefined : statusFilter, creatorName: creatorFilter === "all" ? undefined : creatorFilter }',
  'ReportsClient.tsx': '{ query: debouncedSearch, status: activeTab === "all" ? undefined : activeTab }',
  'CorMembersClient.tsx': '{ query: searchQuery, status: statusFilter === "all" ? undefined : statusFilter }',
  'CorRequestsClient.tsx': '{ query: searchQuery, status: statusFilter === "all" ? undefined : statusFilter }',
  'CorOpportunitiesClient.tsx': '{ query: searchQuery, status: statusFilter === "all" ? undefined : statusFilter }',
  'CorApplicationsClient.tsx': '{ query: searchQuery, status: statusFilter === "all" ? undefined : statusFilter, company: companyFilter === "all" ? undefined : companyFilter }'
};

files.forEach(f => {
  const p = path.join(__dirname, f);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf-8');
    
    const basename = path.basename(f);
    const type = typeMapping[basename];
    const filters = filterMapping[basename];

    // Regex to match any ExportDropdown usage
    const regex = /<ExportDropdown[\s\S]*?\/>/g;
    
    content = content.replace(regex, `<ExportDropdown exportType="${type}" filters={${filters}} />`);

    fs.writeFileSync(p, content);
    console.log('Fixed ' + f);
  }
});
