export interface ChartData {
  id: string;
  title: string;
  description: string;
  type: string;
  data: any[];
}

export const chartData: ChartData[] = [
  {
    id: "salary-compared-to-industry",
    title: "Salary Compared to Industry",
    description: "Compares salaries of alumni to their industry average",
    type: "bar",
    data: [
      { name: "Technology", value: 110000 },
      { name: "Finance", value: 95000 },
      { name: "Healthcare", value: 85000 },
      { name: "Education", value: 65000 },
      { name: "Manufacturing", value: 75000 }
    ]
  },
  {
    id: "employment-rate-over-time",
    title: "Employment Rate Over Time",
    description: "Shows the employment rate of alumni over the years",
    type: "line",
    data: [
      { name: "2018", value: 92 },
      { name: "2019", value: 94 },
      { name: "2020", value: 89 },
      { name: "2021", value: 91 },
      { name: "2022", value: 95 }
    ]
  },
  {
    id: "alumni-distribution-by-major-sector",
    title: "Alumni Distribution by Major Sector",
    description: "Displays the distribution of alumni across different industries",
    type: "pie",
    data: [
      { name: "Technology", value: 35 },
      { name: "Finance", value: 25 },
      { name: "Healthcare", value: 20 },
      { name: "Education", value: 15 },
      { name: "Other", value: 5 }
    ]
  },
  {
    id: "career-satisfaction-ratings",
    title: "Career Satisfaction Ratings",
    description: "Shows the career satisfaction ratings of alumni",
    type: "bar",
    data: [
      { name: "Very Satisfied", value: 45 },
      { name: "Satisfied", value: 30 },
      { name: "Neutral", value: 15 },
      { name: "Dissatisfied", value: 7 },
      { name: "Very Dissatisfied", value: 3 }
    ]
  },
  {
    id: "further-education-pursuits",
    title: "Further Education Pursuits",
    description: "Illustrates the percentage of alumni pursuing further education",
    type: "pie",
    data: [
      { name: "Master's Degree", value: 40 },
      { name: "PhD", value: 15 },
      { name: "Professional Certification", value: 25 },
      { name: "No Further Education", value: 20 }
    ]
  },
  {
    id: "job-search-duration",
    title: "Job Search Duration",
    description: "Shows the average time taken by alumni to find employment",
    type: "bar",
    data: [
      { name: "0-3 months", value: 40 },
      { name: "3-6 months", value: 30 },
      { name: "6-12 months", value: 20 },
      { name: "12+ months", value: 10 }
    ]
  },
  {
    id: "alumni-giving-rate",
    title: "Alumni Giving Rate",
    description: "Tracks the percentage of alumni who donate to the institution",
    type: "line",
    data: [
      { name: "2018", value: 15 },
      { name: "2019", value: 17 },
      { name: "2020", value: 14 },
      { name: "2021", value: 16 },
      { name: "2022", value: 18 }
    ]
  },
  {
    id: "top-employers",
    title: "Top Employers",
    description: "Lists the top companies employing our alumni",
    type: "bar",
    data: [
      { name: "Google", value: 50 },
      { name: "Microsoft", value: 45 },
      { name: "Amazon", value: 40 },
      { name: "Apple", value: 35 },
      { name: "Facebook", value: 30 }
    ]
  },
  {
    id: "entrepreneurship-rate",
    title: "Entrepreneurship Rate",
    description: "Shows the percentage of alumni who have started their own businesses",
    type: "pie",
    data: [
      { name: "Entrepreneurs", value: 15 },
      { name: "Employed", value: 75 },
      { name: "Other", value: 10 }
    ]
  },
  {
    id: "skills-gap-analysis",
    title: "Skills Gap Analysis",
    description: "Identifies the skills alumni feel they lack in their current roles",
    type: "bar",
    data: [
      { name: "Data Analysis", value: 30 },
      { name: "Project Management", value: 25 },
      { name: "Leadership", value: 20 },
      { name: "Communication", value: 15 },
      { name: "Technical Skills", value: 10 }
    ]
  },
  {
    id: "alumni-network-engagement",
    title: "Alumni Network Engagement",
    description: "Measures the level of alumni participation in network events",
    type: "line",
    data: [
      { name: "2018", value: 40 },
      { name: "2019", value: 45 },
      { name: "2020", value: 35 },
      { name: "2021", value: 50 },
      { name: "2022", value: 55 }
    ]
  },
  {
    id: "career-change-frequency",
    title: "Career Change Frequency",
    description: "Shows how often alumni change careers after graduation",
    type: "pie",
    data: [
      { name: "No changes", value: 50 },
      { name: "1 change", value: 30 },
      { name: "2 changes", value: 15 },
      { name: "3+ changes", value: 5 }
    ]
  },
  {
    id: "work-life-balance-satisfaction",
    title: "Work-Life Balance Satisfaction",
    description: "Illustrates alumni satisfaction with their work-life balance",
    type: "bar",
    data: [
      { name: "Very Satisfied", value: 35 },
      { name: "Satisfied", value: 40 },
      { name: "Neutral", value: 15 },
      { name: "Dissatisfied", value: 7 },
      { name: "Very Dissatisfied", value: 3 }
    ]
  },
  {
    id: "alumni-geographic-distribution",
    title: "Alumni Geographic Distribution",
    description: "Shows where alumni are located geographically",
    type: "pie",
    data: [
      { name: "North America", value: 50 },
      { name: "Europe", value: 25 },
      { name: "Asia", value: 15 },
      { name: "Other", value: 10 }
    ]
  },
  {
    id: "professional-development-participation",
    title: "Professional Development Participation",
    description: "Tracks alumni participation in professional development programs",
    type: "line",
    data: [
      { name: "2018", value: 30 },
      { name: "2019", value: 35 },
      { name: "2020", value: 40 },
      { name: "2021", value: 45 },
      { name: "2022", value: 50 }
    ]
  },
  {
    id: "alumni-mentorship-program",
    title: "Alumni Mentorship Program",
    description: "Shows the number of alumni participating in mentorship programs",
    type: "bar",
    data: [
      { name: "Mentors", value: 100 },
      { name: "Mentees", value: 150 },
      { name: "Both", value: 50 },
      { name: "Not Participating", value: 700 }
    ]
  }
];

export async function fetchChartData(): Promise<ChartData[]> {
  // In a real application, you would fetch this data from an API
  // For now, we'll just return the static data
  return chartData;
}

export async function getChartById(id: string): Promise<ChartData | undefined> {
  return chartData.find(chart => chart.id === id);
}

