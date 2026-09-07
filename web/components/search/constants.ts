export const suggestionTags = [
  "Restaurant managers in New Jersey",
  "Alumni working in healthcare now",
  "Former employees who went to business school after leaving",
  "Former cashiers now in customer success roles",
  "Alumni who started their own companies",
  "People who went from fast food to finance",
  "Harvard MBA graduates who worked at Chick-fil-A",
  "Former team members now in hospitality",
  "Alumni who became VPs or directors",
  "Former employees in the startup ecosystem",
  "People who got their degree while working here",
  "Kitchen staff who became operations managers",
  "Operations directors at QSR chains",
  "Former employees who went into consulting",
  "Alumni in the hospitality industry",
  "People with culinary arts education",
  "Drive-thru team leads now in logistics",
  "Corporate employees in Atlanta headquarters",
  "People who transitioned to marketing roles",
  "Former shift leaders now in C-suite positions",
  "Alumni with engineering backgrounds",
  "Former employees now in real estate",
  "Quality assurance in food service",
  "Alumni who worked here during college (2018-2022)",
  "People who became franchise owners",
  "Former trainers who became HR professionals",
  "People who moved into tech roles",
  "Alumni working in major metropolitan areas",
  "Former employees with marketing degrees",
  "People who moved into education sector",
  "Supply chain managers in retail",
  "Alumni in senior management roles",
  "Team members who became district managers",
  "Alumni working in nonprofit organizations",
  "Training and development specialists",
  "People who left during COVID and pivoted careers",
  "Former employees in technology companies",
  "Alumni who studied hospitality management",
  "Customer experience managers",
  "Former employees who relocated for better opportunities",
  "People who transitioned to retail management",
  "People who completed leadership development programs",
  "Former supervisors now running their own businesses",
  "Food safety and compliance officers",
  "Franchise development specialists",
  "Alumni who studied hospitality management",
  "Business analysts in hospitality",
  "Digital marketing in food brands"
]

export const secondRowSuggestionTags = [
  "Executive chefs at upscale restaurants",
  "Alumni now leading Fortune 500 teams",
  "Former crew members turned entrepreneurs",
  "People who transitioned to investment banking",
  "Regional managers across multiple states",
  "Alumni working at Google, Apple, Microsoft",
  "Former employees now in private equity",
  "People who became restaurant franchise owners",
  "Alumni working in sustainable food initiatives",
  "Former team leads now in executive coaching",
  "People who pivoted to venture capital",
  "Alumni running their own consulting firms",
  "Former employees in pharmaceutical sales",
  "People who became celebrity chefs",
  "Alumni working at top consulting firms",
  "Former managers now in hospitality tech",
  "People who transitioned to luxury brands",
  "Alumni leading social media agencies",
  "Former employees in corporate training",
  "People who became food industry analysts",
  "Alumni working in sports management",
  "Former crew members now in film production",
  "People who transitioned to renewable energy",
  "Alumni leading diversity and inclusion",
  "Former employees in government relations",
  "People who became professional speakers",
  "Alumni working at entertainment companies",
  "Former managers in supply chain optimization",
  "People who transitioned to biotech startups",
  "Alumni leading customer experience teams",
  "Former employees now travel industry executives",
  "People who became food network personalities",
  "Alumni working in artificial intelligence",
  "Former team members in aerospace",
  "People who transitioned to fashion retail",
  "Alumni leading nonprofit organizations",
  "Former employees in financial planning",
  "People who became wellness industry leaders",
  "Alumni working in cybersecurity",
  "Former managers now in e-commerce",
  "People who transitioned to music industry",
  "Alumni leading automotive innovation",
  "Former employees in real estate development",
  "People who became lifestyle brand founders",
  "Alumni working in clean technology",
  "Former crew members in professional sports",
  "People who transitioned to healthcare innovation"
]

export const allSuggestionTags = [...suggestionTags, ...secondRowSuggestionTags];

export const tagScrollAnimation = `
  .scrolling-tags-container {
    width: 100%;
    overflow: hidden;
    margin: 1rem 0;
  }
  
  .scrolling-tags {
    display: flex;
    white-space: nowrap;
    transform: translateX(-${Math.floor(Math.random() * 100)}%);
  }
  
  .scrolling-tags-content {
    display: inline-flex;
    animation: scroll 300s linear infinite;
  }

  .scrolling-tags-content-slow {
    display: inline-flex;
    animation: scroll-slow 450s linear infinite;
  }
  
  .tag-item {
    display: inline-block;
    background-color: rgba(16, 185, 129, 0.1);
    color: rgb(4, 120, 87);
    padding: 0.6rem 1.2rem;
    margin: 0 0.5rem;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
    white-space: nowrap;
  }

  .tag-item-yellow {
    display: inline-block;
    background-color: rgba(251, 191, 36, 0.1);
    color: rgb(146, 64, 14);
    padding: 0.6rem 1.2rem;
    margin: 0 0.5rem;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1rem;
    white-space: nowrap;
  }
  
  .tag-item:hover {
    background-color: rgba(16, 185, 129, 0.2);
    transform: translateY(-2px);
  }

  .tag-item-yellow:hover {
    background-color: rgba(251, 191, 36, 0.2);
    transform: translateY(-2px);
  }
  
  @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
  }

  @keyframes scroll-slow {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
  }
`; 