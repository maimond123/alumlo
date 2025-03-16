"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Download, Maximize2, X, ChevronLeft, ChevronRight, BarChart4, Search, Mail } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import * as htmlToImage from "html-to-image"
import { saveAs } from "file-saver"
import Image from "next/image"
import { PieChart, BarChart, SalaryBarChart, GeographyBarChart, AverageSalaryByIndustryBarChart, IndustryPieChart } from '../../components/chart'
import { supabase } from '../data/supabase'
import { useRouter } from 'next/navigation'
import { getUserEmail } from '../utils/auth'


export default function ReportsPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const { isSidebarOpen } = useSidebar()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !email.includes('@')) {
      setSubmitError("Please enter a valid email address")
      return
    }
    
    setIsSubmitting(true)
    setSubmitError("")
    
    try {
      // Store the email in Supabase
      const { error } = await supabase
        .from('premium_report_leads')
        .insert([{ email, created_at: new Date().toISOString() }])
      
      if (error) throw error
      
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting email:', error)
      setSubmitError("Failed to submit your email. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar />
      <div className={`relative flex-1 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-72" : "ml-24"}`}>
        <ReportsContent />
        <ComingSoonOverlay 
          email={email}
          setEmail={setEmail}
          isSubmitted={isSubmitted}
          isSubmitting={isSubmitting}
          submitError={submitError}
          handleEmailSubmit={handleEmailSubmit}
        />
      </div>
    </div>
  )
}

function ComingSoonOverlay({ 
  email, 
  setEmail, 
  isSubmitted, 
  isSubmitting, 
  submitError, 
  handleEmailSubmit 
}: { 
  email: string; 
  setEmail: (email: string) => void; 
  isSubmitted: boolean; 
  isSubmitting: boolean; 
  submitError: string; 
  handleEmailSubmit: (e: React.FormEvent) => Promise<void>; 
}) {
  return (
    <div className="absolute top-0 right-0 bottom-0 left-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-black mb-2">Report Builder</h2>
          <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-4">
            Beta Feature
          </div>
          <p className="text-gray-600 mb-5">
            Building your own report with AI is currently a beta feature under development.
          </p>
          
          <div className="bg-black/5 p-4 rounded-lg border-l-4 border-black mb-6">
            <p className="text-black font-bold text-xl">
              Need professional-grade reports?
            </p>
            <p className="text-gray-800 mt-1">
              We offer premium, customizable reporting solutions for institutions requiring deeper insights.
            </p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
          <h3 className="font-semibold text-lg mb-2">Premium Reporting Solutions</h3>
          <ul className="space-y-2 mb-4">
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Professionally designed reports with advanced filtering options</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Comparative analysis across multiple graduation years</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Export options for presentations and stakeholder meetings</span>
            </li>
            <li className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span>Strategic insights and recommendations tailored to your institution</span>
            </li>
          </ul>
        </div>
        
        {isSubmitted ? (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <Check className="h-6 w-6 text-green-500 mx-auto mb-2" />
            <p className="text-green-800 font-medium">Thank you for your interest!</p>
            <p className="text-green-600 text-sm">We'll be in touch with more information about our premium reporting solutions.</p>
          </div>
        ) : (
          <div>
            <p className="text-center mb-4 font-semibold text-lg">
              Interested in learning more about our premium reporting solutions?
            </p>
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="flex items-center">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none"
                    disabled={isSubmitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`bg-emerald-600 text-white px-6 py-3 rounded-r-lg font-medium text-base ${
                    isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-emerald-700"
                  }`}
                >
                  {isSubmitting ? "Submitting..." : "Learn More"}
                </button>
              </div>
              {submitError && (
                <p className="text-red-500 text-sm">{submitError}</p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function ReportsContent() {
  const router = useRouter()
  const [schoolName, setSchoolName] = useState<string>('')
  const { isSidebarOpen } = useSidebar()
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [selectedYears, setSelectedYears] = useState<string[]>([])
  const [yearInput, setYearInput] = useState("")
  const [suggestedYears, setSuggestedYears] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<any>(null)
  const [isDecadeView, setIsDecadeView] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)
  const [salaryData, setSalaryData] = useState<any>(null)
  const [industryData, setIndustryData] = useState<any>(null)
  const [locationData, setLocationData] = useState<Array<{ name: string; value: number }>>([])
  const [industrySalaryData, setIndustrySalaryData] = useState<Array<{ name: string; value: number }>>([])
  const [graduateSchoolData, setGraduateSchoolData] = useState<any>(null)
  const [explanations, setExplanations] = useState<{[key: string]: {factual: string, strategic: string}}>({});
  const [executiveSummary, setExecutiveSummary] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');
  const [isLoadingExplanations, setIsLoadingExplanations] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [option1Enabled, setOption1Enabled] = useState(false)
  const [option2Enabled, setOption2Enabled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    reportGeneration: false,
    salaryData: false,
    industryData: false,
    locationData: false,
    graduateSchoolData: false,
    industrySalaryData: false,
    explanations: false,
    executiveSummary: false,
    recommendations: false
  });
  const [initialSelectedOptions, setInitialSelectedOptions] = useState<string[]>([])
  const [initialSelectedYears, setInitialSelectedYears] = useState<string[]>([])

  useEffect(() => {
    const fetchSchoolName = async () => {
      try {
        const userEmail = await getUserEmail()
        
        if (!userEmail) {
          console.error('No email found for user')
          throw new Error('No user email found')
        }
    
        const { data, error } = await supabase
          .from('customer_information')
          .select('school_name')
          .eq('school_email', userEmail)
          .single()
      
  
        if (error) {
          console.error('Supabase query error:', error)
          throw error
        }
  
        if (data) {
          setSchoolName(data.school_name)
        }
  
      } catch (err: any) {
        console.error('Error fetching school name:', err)
        if (err.message?.includes('not authenticated')) {
          router.push('/login')
          return
        }
      }
    }
  
    fetchSchoolName()
  }, [router])
  const reportOptions = [
    { id: "salary", label: "Salary Distribution" },
    { id: "salary_by_industry", label: "Average Salary by Industry" },
    { id: "graduate_school", label: "Graduate School Distribution" },
    { id: "location", label: "Geographic Distribution"},
    { id: "industry", label: "Industry Sectors" },
  ]

  const years = Array.from({ length: 2024 - 1950 + 1 }, (_, i) => (2024 - i).toString())
  const decades = Array.from({ length: 8 }, (_, i) => `${2020 - i * 10}s`)

  const toggleOption = (id: string) => {
    if (generatedReport) {
      setErrorMessage(
        "You cannot change data points while a report is active. Please click 'Clear Report' first, then make your new selections."
      );
      setShowErrorModal(true);
      return;
    }
    
    setSelectedOptions(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }

  const selectAllYears = () => {
    setSelectedYears(years)
    setYearInput("")
    setSuggestedYears([])
  }

  const handleYearInput = (input: string) => {
    setYearInput(input)
    if (input) {
      const suggestions = isDecadeView
        ? decades.filter((decade) => decade.startsWith(input)).slice(0, 5)
        : years.filter((year) => year.startsWith(input)).slice(0, 5)
      setSuggestedYears(suggestions)
      setYearDropdownOpen(true);
    } else {
      setSuggestedYears([])
      setYearDropdownOpen(true);
    }
  }

  const selectYear = (year: string) => {
    if (generatedReport) {
      setErrorMessage(
        "You cannot add new class years while a report is active. Please click 'Clear Report' first, then make your new selections."
      );
      setShowErrorModal(true);
      return;
    }
    
    if (!selectedYears.includes(year)) {
      setSelectedYears(prev => [...prev, year])
    }
    setYearInput("")
    setSuggestedYears([])
  }

  const removeYear = (year: string) => {
    if (generatedReport) {
      setErrorMessage(
        "You cannot remove class years while a report is active. Please click 'Clear Report' first, then make your new selections."
      );
      setShowErrorModal(true);
      return;
    }
    
    setSelectedYears((prev) => prev.filter((y) => y !== year))
  }

  const handleGenerateReport = async () => {
    // Check if selections are empty
    if (selectedOptions.length === 0 || selectedYears.length === 0) {
      setErrorMessage(
        selectedOptions.length === 0 && selectedYears.length === 0
          ? "Please select at least one data point and one class year before generating a report."
          : selectedOptions.length === 0
          ? "Please select at least one data point before generating a report."
          : "Please select at least one class year before generating a report."
      );
      setShowErrorModal(true);
      return;
    }
    
    console.log('[DEBUG] Starting report generation with:', { selectedOptions, selectedYears });
    
    // Save initial selections
    setInitialSelectedOptions([...selectedOptions]);
    setInitialSelectedYears([...selectedYears]);
    
    // Set overall generation state to true
    setIsGeneratingReport(true);
    setIsLoading(true);
    
    // Set individual loading states based on selected options
    setLoadingStates(prev => ({
      ...prev,
      reportGeneration: true,
      salaryData: selectedOptions.includes('salary'),
      industryData: selectedOptions.includes('industry'),
      locationData: selectedOptions.includes('location'),
      graduateSchoolData: selectedOptions.includes('graduate_school'),
      industrySalaryData: selectedOptions.includes('salary_by_industry'),
      explanations: true,
      executiveSummary: true,
      recommendations: true
    }));
    
    try {
      console.log('[DEBUG] Creating new report object');
      // Create a new report object with the current selections
      const newReport = {
        options: [...selectedOptions],
        years: [...selectedYears]
      };
      
      // Set the generated report
      console.log('[DEBUG] Setting generated report state');
      setGeneratedReport(newReport);
      
      // Wait for data to be fetched before generating explanations
      console.log('[DEBUG] Waiting for data to be fetched');
      
      // Wait a short time for the data fetching useEffects to run
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('[DEBUG] Calling generateExplanations directly');
      // Call generateExplanations after data has been fetched
      await generateExplanations(newReport);
      
      // Mark report generation as complete
      setLoadingStates(prev => ({
        ...prev,
        reportGeneration: false
      }));
      
      console.log('[DEBUG] Report generated successfully:', { selectedOptions, selectedYears });
    } catch (error) {
      console.error('[DEBUG] Error generating report:', error);
      // Reset loading states on error
      setLoadingStates(prev => ({
        ...prev,
        reportGeneration: false,
        explanations: false,
        executiveSummary: false,
        recommendations: false
      }));
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    console.log("Download button clicked");
    console.log("Generated report:", generatedReport);
    console.log("Total pages:", totalPages);
    
    if (!generatedReport) {
      console.log("No report generated yet, showing error modal");
      setErrorMessage(
        "Please generate a report first before downloading. Select your data points and class years, then click the 'Generate Report' button."
      );
      setShowErrorModal(true);
      return;
    }

    try {
      console.log("Starting download process");
      // Store the current page
      const originalPage = currentPage;
      console.log("Original page:", originalPage);
      
      // For each page, render it and capture it
      const pageImages = [];
      
      for (let page = 1; page <= totalPages; page++) {
        console.log(`Processing page ${page} of ${totalPages}`);
        // Set current page to render the correct content
        setCurrentPage(page);
        
        // Wait for the page to render
        console.log("Waiting for page to render");
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (reportRef.current) {
          console.log("Report ref exists, capturing page");
          try {
            // Capture the current page
            const dataUrl = await htmlToImage.toPng(reportRef.current, { quality: 0.95 });
            console.log(`Page ${page} captured successfully, data URL length:`, dataUrl.length);
            pageImages.push(dataUrl);
          } catch (err) {
            console.error(`Error capturing page ${page}:`, err);
          }
        } else {
          console.error("Report ref is null for page", page);
        }
      }
      
      console.log(`Captured ${pageImages.length} pages`);
      
      // Restore original page
      setCurrentPage(originalPage);
      
      // If we have multiple pages, combine them into a PDF
      if (pageImages.length > 1) {
        console.log("Creating PDF with multiple pages");
        try {
          // Use jsPDF to create a PDF with all pages
          const { jsPDF } = await import('jspdf');
          console.log("jsPDF imported successfully");
          
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'in',
            format: [8.5, 11]
          });
          
          // Add each image as a page
          for (let i = 0; i < pageImages.length; i++) {
            console.log(`Adding page ${i+1} to PDF`);
            if (i > 0) {
              pdf.addPage();
            }
            pdf.addImage(pageImages[i], 'PNG', 0, 0, 8.5, 11);
          }
          
          // Save the PDF
          console.log("Saving PDF");
          pdf.save("alumni-success-metrics-report.pdf");
        } catch (err) {
          console.error("Error creating PDF:", err);
        }
      } else if (pageImages.length === 1) {
        // If only one page, save as PNG
        console.log("Saving single page as PNG");
        saveAs(pageImages[0], "alumni-success-metrics-report.png");
      } else {
        console.error("No pages were captured");
      }
    } catch (error) {
      console.error("Error in download process:", error);
    }
  };

  useEffect(() => {
    if (selectedOptions.includes('salary') && selectedYears.length > 0 && schoolName && isGeneratingReport) {
      const fetchSalaryData = async () => {
        setLoadingStates(prev => ({ ...prev, salaryData: true }));
        
        const { data, error } = await supabase
          .from(schoolName + '_distribution')
          .select('current_salary_distribution, class_year')
          .in('class_year', selectedYears)
          .not('current_salary_distribution', 'is', null);

        if (error) {
          console.error('Error fetching salary data:', error);
        }

        console.log('Salary data fetched:', data);
        if (data) {
          setSalaryData(data);
        }
        
        setLoadingStates(prev => ({ ...prev, salaryData: false }));
      };

      fetchSalaryData();
    }
  }, [selectedOptions, selectedYears, schoolName, isGeneratingReport]);

  useEffect(() => {
    if (selectedOptions.includes('industry') && selectedYears.length > 0 && schoolName && isGeneratingReport) {
      const fetchIndustryData = async () => {
        setLoadingStates(prev => ({ ...prev, industryData: true }));
        
        const { data, error } = await supabase
          .from(schoolName + '_distribution')
          .select('current_industry_distribution, class_year')
          .in('class_year', selectedYears)
          .not('current_industry_distribution', 'is', null);

        if (error) {
          console.error('Error fetching industry data:', error);
        }

        if (data) {
          setIndustryData(data);
        }
        
        setLoadingStates(prev => ({ ...prev, industryData: false }));
      };

      fetchIndustryData();
    }
  }, [selectedOptions, selectedYears, schoolName, isGeneratingReport]);

  useEffect(() => {
    if (selectedOptions.includes('location') && selectedYears.length > 0 && schoolName && isGeneratingReport) {
      const fetchLocationData = async () => {
        setLoadingStates(prev => ({ ...prev, locationData: true }));
        
        const { data, error } = await supabase
          .from(schoolName + '_distribution')
          .select('current_job_location_distribution, class_year')
          .in('class_year', selectedYears)
          .not('current_job_location_distribution', 'is', null);

        if (error) {
          console.error('Error fetching location data:', error);
        }

        if (data) {
          // Process the location data
          const locationCounts: { [key: string]: number } = {};
          
          data.forEach(profile => {
            if (profile.current_job_location_distribution) {
              Object.entries(profile.current_job_location_distribution).forEach(([city, count]) => {
                locationCounts[city] = (locationCounts[city] || 0) + Number(count);
              });
            }
          });

          // Convert to chart format and sort by value
          const chartData = Object.entries(locationCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Take top 10 cities

          setLocationData(chartData);
        }
        
        setLoadingStates(prev => ({ ...prev, locationData: false }));
      };

      fetchLocationData();
    }
  }, [selectedOptions, selectedYears, schoolName, isGeneratingReport]);

  useEffect(() => {
    if (selectedOptions.includes('salary_by_industry') && selectedYears.length > 0 && schoolName && isGeneratingReport) {
      const fetchIndustrySalaryData = async () => {
        setLoadingStates(prev => ({ ...prev, industrySalaryData: true }));
        
        const { data, error } = await supabase
          .from(schoolName + '_distribution')
          .select('average_salary_by_industry_distribution, class_year')
          .in('class_year', selectedYears)
          .not('average_salary_by_industry_distribution', 'is', null);

        if (error) {
          console.error('Error fetching industry salary data:', error);
        }

        if (data && data.length > 0) {
          // Process the industry salary data
          const industrySalaries: { [key: string]: number } = {};
          
          data.forEach(profile => {
            if (profile.average_salary_by_industry_distribution) {
              Object.entries(profile.average_salary_by_industry_distribution).forEach(([industry, salary]) => {
                if (industrySalaries[industry]) {
                  industrySalaries[industry] = (industrySalaries[industry] + Number(salary)) / 2;
                } else {
                  industrySalaries[industry] = Number(salary);
                }
              });
            }
          });

          // Convert to chart format and sort by value
          const chartData = Object.entries(industrySalaries)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

          setIndustrySalaryData(chartData);
        }
        
        setLoadingStates(prev => ({ ...prev, industrySalaryData: false }));
      };

      fetchIndustrySalaryData();
    }
  }, [selectedOptions, selectedYears, schoolName, isGeneratingReport]);

  useEffect(() => {
    if (selectedOptions.includes('graduate_school') && selectedYears.length > 0 && schoolName && isGeneratingReport) {
      const fetchGraduateSchoolData = async () => {
        setLoadingStates(prev => ({ ...prev, graduateSchoolData: true }));
        
        const { data, error } = await supabase
          .from(schoolName + '_distribution')
          .select('graduate_school_distribution, class_year')
          .in('class_year', selectedYears)
          .not('graduate_school_distribution', 'is', null);

        if (error) {
          console.error('Error fetching graduate school data:', error);
        }

        if (data) {
          setGraduateSchoolData(data);
        }
        
        setLoadingStates(prev => ({ ...prev, graduateSchoolData: false }));
      };

      fetchGraduateSchoolData();
    }
  }, [selectedOptions, selectedYears, schoolName, isGeneratingReport]);

  const generateExplanations = async (report = generatedReport) => {
    console.log('[DEBUG] generateExplanations called with report:', report);
    if (!report) {
      console.log('[DEBUG] No report provided, exiting generateExplanations');
      return;
    }
    
    console.log('[DEBUG] Setting loading states for explanations');
    setLoadingStates(prev => ({ 
      ...prev, 
      explanations: true,
      executiveSummary: true,
      recommendations: true 
    }));
    
    // Calculate how many pages we'll need (1 for intro, 1 for each visualization)
    const visualizationCount = report.options.length;
    console.log('[DEBUG] Setting total pages to:', visualizationCount + 2);
    setTotalPages(visualizationCount + 2); // +1 for intro, +1 for recommendations
    
    console.log('[DEBUG] Creating explanation promises for options:', report.options);
    const explanationPromises = report.options.map(async (option: string) => {
      let chartData;
      let chartTitle;
      
      console.log('[DEBUG] Processing option:', option);
      switch(option) {
        case 'salary':
          console.log('[DEBUG] Processing salary data:', salaryData);
          if (!salaryData) return null;
          const salaryYearData = salaryData.find((item: any) => 
            item.class_year.toString() === report.years[0].toString()
          );
          if (!salaryYearData?.current_salary_distribution) return null;
          chartData = Object.entries(salaryYearData.current_salary_distribution)
            .map(([range, count]) => ({
              name: range,
              value: typeof count === 'number' ? count : Number(count)
            }));
          chartTitle = "Salary Distribution";
          break;
          
        case 'industry':
          if (!industryData) return null;
          const industryYearData = industryData.find((item: any) => 
            item.class_year.toString() === report.years[0].toString()
          );
          if (!industryYearData?.current_industry_distribution) return null;
          chartData = Object.entries(industryYearData.current_industry_distribution)
            .map(([industry, value]) => ({
              name: industry,
              value: typeof value === 'number' ? value : Number(value)
            }));
          chartTitle = "Industry Distribution";
          break;
          
        case 'location':
          if (!locationData.length) return null;
          chartData = locationData;
          chartTitle = "Geographic Distribution";
          break;
          
        case 'graduate_school':
          if (!graduateSchoolData) return null;
          const gradSchoolYearData = graduateSchoolData.find((item: any) => 
            item.class_year.toString() === report.years[0].toString()
          );
          if (!gradSchoolYearData?.graduate_school_distribution) return null;
          chartData = Object.entries(gradSchoolYearData.graduate_school_distribution)
            .map(([school, value]) => ({
              name: school,
              value: typeof value === 'number' ? value : Number(value)
            }));
          chartTitle = "Graduate School Distribution";
          break;
          
        case 'salary_by_industry':
          if (!industrySalaryData.length) return null;
          chartData = industrySalaryData;
          chartTitle = "Average Salary by Industry";
          break;
          
        default:
          return null;
      }
      
      if (!chartData) {
        console.log('[DEBUG] No chart data for option:', option);
        return null;
      }
      
      try {
        console.log('[DEBUG] Calling AI to generate explanation for:', option);
        // Call AI to generate explanations
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              { 
                role: 'user', 
                content: `Please provide two sections of analysis for this ${chartTitle} data: 
                1. A factual interpretation (what the chart shows with specific data points)
                2. Strategic implications (why it matters to the school and how to use this information strategically)`
              }
            ],
            chartId: option,
            chartType: option === 'location' || option === 'salary_by_industry' ? 'bar' : 
                      (option === 'industry' || option === 'graduate_school' ? 'pie' : 'bar'),
            chartTitle,
            chartData
          }),
        });
        
        console.log('[DEBUG] AI response status:', response.status);
        if (!response.ok) {
          throw new Error('Failed to generate explanation');
        }
        
        // Process streaming response
        const reader = response.body?.getReader();
        let result = '';
        
        if (reader) {
          console.log('[DEBUG] Processing streaming response');
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(5));
                  result += data.content || '';
                } catch (e) {
                  console.error('[DEBUG] Error parsing JSON:', e);
                }
              }
            }
          }
        }
        
        console.log('[DEBUG] Explanation generated for:', option);
        
        // Split into factual and strategic sections
        const sections = result.split(/(?=Strategic implications)/i);
        const factual = sections[0].replace(/Factual interpretation:?/i, '').trim();
        const strategic = sections.length > 1 ? sections[1].trim() : '';
        
        return { option, explanation: { factual, strategic } };
      } catch (error) {
        console.error(`[DEBUG] Error generating explanation for ${option}:`, error);
        return { 
          option, 
          explanation: { 
            factual: `Unable to generate analysis for ${chartTitle}.`,
            strategic: `Please refer to the visualization for insights.`
          } 
        };
      }
    });
    
    // Wait for all explanations
    console.log('[DEBUG] Waiting for all explanation promises to resolve');
    const results = await Promise.all(explanationPromises);
    
    // Update explanations state
    console.log('[DEBUG] Updating explanations state with results');
    const explanationsMap: {[key: string]: {factual: string, strategic: string}} = {};
    results.forEach(result => {
      if (result) {
        explanationsMap[result.option] = result.explanation;
      }
    });
    setExplanations(explanationsMap);
    
    // Generate executive summary
    try {
      console.log('[DEBUG] Generating executive summary');
      const summaryResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: `Create a concise executive summary (2-3 paragraphs) for a report containing the following visualizations: ${report.options.map((option: string) => 
              option === 'salary' ? 'Salary Distribution' :
              option === 'industry' ? 'Industry Distribution' :
              option === 'location' ? 'Geographic Distribution' :
              option === 'graduate_school' ? 'Graduate School Distribution' :
              option === 'salary_by_industry' ? 'Average Salary by Industry' : option
            ).join(', ')}.`
          }],
          chartId: 'executive_summary',
          chartType: 'summary',
          chartTitle: 'Executive Summary',
          chartData: []
        }),
      });
      
      console.log('[DEBUG] Executive summary response status:', summaryResponse.status);
      if (summaryResponse.ok) {
        const reader = summaryResponse.body?.getReader();
        let summaryResult = '';
        
        if (reader) {
          console.log('[DEBUG] Processing executive summary streaming response');
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(5));
                  summaryResult += data.content || '';
                } catch (e) {
                  console.error('[DEBUG] Error parsing JSON:', e);
                }
              }
            }
          }
        }
        
        console.log('[DEBUG] Setting executive summary state');
        setExecutiveSummary(summaryResult);
      }
      
      // Generate recommendations
      console.log('[DEBUG] Generating recommendations');
      const recommendationsResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [{ 
            role: 'user', 
            content: `Based on the visualizations in this report (${report.options.map((option: string) => 
              option === 'salary' ? 'Salary Distribution' :
              option === 'industry' ? 'Industry Distribution' :
              option === 'location' ? 'Geographic Distribution' :
              option === 'graduate_school' ? 'Graduate School Distribution' :
              option === 'salary_by_industry' ? 'Average Salary by Industry' : option
            ).join(', ')}), provide 3-4 specific, actionable recommendations for the school.`
          }],
          chartId: 'recommendations',
          chartType: 'recommendations',
          chartTitle: 'Recommendations',
          chartData: []
        }),
      });
      
      console.log('[DEBUG] Recommendations response status:', recommendationsResponse.status);
      if (recommendationsResponse.ok) {
        const reader = recommendationsResponse.body?.getReader();
        let recommendationsResult = '';
        
        if (reader) {
          console.log('[DEBUG] Processing recommendations streaming response');
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(5));
                  recommendationsResult += data.content || '';
                } catch (e) {
                  console.error('[DEBUG] Error parsing JSON:', e);
                }
              }
            }
          }
        }
        
        console.log('[DEBUG] Setting recommendations state');
        setRecommendations(recommendationsResult);
      }
    } catch (error) {
      console.error('[DEBUG] Error generating summary or recommendations:', error);
    }
    
    console.log('[DEBUG] Setting loading states to false');
    setLoadingStates(prev => ({ 
      ...prev, 
      explanations: false,
      executiveSummary: false,
      recommendations: false 
    }));
    
    // Check if all processes are complete
    console.log('[DEBUG] Checking if all processes are complete');
    checkAllProcessesComplete();
  };

  // Update the useEffect to handle clicking outside both dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(event.target as Node)) {
        setSuggestedYears([]);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add a function to check if all processes are complete
  const checkAllProcessesComplete = () => {
    const allComplete = !Object.values(loadingStates).some(state => state === true);
    if (allComplete) {
      setIsGeneratingReport(false);
      setIsLoading(false);
    }
  };

  // Add an effect to check completion whenever loading states change
  useEffect(() => {
    checkAllProcessesComplete();
  }, [loadingStates]);

  // Add this function to handle clearing the report
  const handleClearReport = () => {
    // Reset report-related states
    setGeneratedReport(null);
    setCurrentPage(1);
    setTotalPages(1);
    setSalaryData(null);
    setIndustryData(null);
    setLocationData([]);
    setIndustrySalaryData([]);
    setGraduateSchoolData(null);
    setExplanations({});
    setExecutiveSummary('');
    setRecommendations('');
    
    // Reset loading states
    setIsGeneratingReport(false);
    setIsLoading(false);
    setLoadingStates({
      reportGeneration: false,
      salaryData: false,
      industryData: false,
      locationData: false,
      graduateSchoolData: false,
      industrySalaryData: false,
      explanations: false,
      executiveSummary: false,
      recommendations: false
    });
    
    console.log('Report cleared');
  };

  // Add toggle handlers for the Step 3 options
  const toggleOption1 = () => {
    // Check if there are at least 2 class years selected
    if (selectedYears.length < 2) {
      setErrorMessage(
        "You need to select at least 2 class years to use the Cross Year Comparison feature. Please add more class years first."
      );
      setShowErrorModal(true);
      return;
    }
    
    // If we have enough years, toggle the option
    setOption1Enabled(true);
    setOption2Enabled(false);
  };

  const toggleOption2 = () => {
    // Check if there are at least 2 class years selected
    if (selectedYears.length < 2) {
      setErrorMessage(
        "You need to select at least 2 class years to use the Year-by-Year Analysis feature. Please add more class years first."
      );
      setShowErrorModal(true);
      return;
    }
    
    // If we have enough years, toggle the option
    setOption2Enabled(true);
    setOption1Enabled(false);
  };

  const renderChart = (chartType: string) => {
    if (loadingStates[chartType === 'salary' ? 'salaryData' : 
                      chartType === 'industry' ? 'industryData' : 
                      chartType === 'location' ? 'locationData' : 
                      chartType === 'graduate_school' ? 'graduateSchoolData' : 
                      chartType === 'salary_by_industry' ? 'industrySalaryData' : 'reportGeneration']) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
        </div>
      );
    }

    switch (chartType) {
      case 'salary':
        return salaryData ? <SalaryBarChart data={Object.entries(salaryData[0]?.current_salary_distribution || {}).map(([name, value]) => ({ name, value: Number(value) }))} /> : null;
      case 'industry':
        return industryData ? <IndustryPieChart data={Object.entries(industryData[0]?.current_industry_distribution || {}).map(([name, value]) => ({ name, value: Number(value) }))} /> : null;
      case 'location':
        return locationData.length > 0 ? <GeographyBarChart data={locationData} /> : null;
      case 'graduate_school':
        return graduateSchoolData ? <PieChart data={Object.entries(graduateSchoolData[0]?.graduate_school_distribution || {}).map(([name, value]) => ({ name, value: Number(value) }))} /> : null;
      case 'salary_by_industry':
        return industrySalaryData.length > 0 ? <AverageSalaryByIndustryBarChart data={industrySalaryData} /> : null;
      default:
        return null;
    }
  };

  const ReportContent = () => {
    return (
      <div ref={reportRef} className="w-[8.5in] min-h-[11in] bg-white shadow-2xl relative">
        <div className="absolute top-8 left-8 flex items-center">
          <Image src="/assets/icons8-atom-24.png" alt="AlumIntel Logo" width={24} height={24} />
          <span className="ml-2 text-xl font-bold text-black">AlumIntel</span>
        </div>
        <div className="p-8 pt-20">
          {!generatedReport ? (
            <div className="min-h-[calc(11in-4rem)] flex flex-col items-center justify-center text-gray-500">
              <BarChart4 className="w-16 h-16 mb-4 text-gray-500" />
              <p>Select data points to preview your report</p>
            </div>
          ) : (
            <>
              {/* Report Title */}
              <h1 className="text-2xl font-bold text-center mb-6">
                Alumni Success Metrics Report
              </h1>
              
              {currentPage === 1 && (
                <>
                  {/* Executive Summary on first page */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">Executive Summary</h2>
                    <div className="text-sm text-gray-700">
                      {loadingStates.executiveSummary ? (
                        <div className="flex items-center justify-center h-24">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                        </div>
                      ) : (
                        <p>{executiveSummary}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {currentPage > 1 && currentPage < totalPages && (
                <>
                  {/* Chart Section - Fixed height container */}
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                      {selectedOptions[currentPage - 2] === 'salary' && 'Salary Distribution'}
                      {selectedOptions[currentPage - 2] === 'industry' && 'Industry Distribution'}
                      {selectedOptions[currentPage - 2] === 'location' && 'Geographic Distribution'}
                      {selectedOptions[currentPage - 2] === 'graduate_school' && 'Graduate School Distribution'}
                      {selectedOptions[currentPage - 2] === 'salary_by_industry' && 'Average Salary by Industry'}
                    </h2>
                    
                    {/* Fixed height chart container */}
                    <div className="h-[350px] w-full mb-6">
                      {renderChart(selectedOptions[currentPage - 2])}
                    </div>
                    
                    {/* Analysis Section - Always below the chart */}
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-2">Key Findings</h3>
                      <div className="text-sm text-gray-700 mb-4">
                        {loadingStates.explanations ? (
                          <div className="flex items-center justify-center h-16">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                          </div>
                        ) : (
                          <p>{explanations[selectedOptions[currentPage - 2]]?.factual || 'Analysis will appear here once generated.'}</p>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">Strategic Implications</h3>
                      <div className="text-sm text-gray-700">
                        {loadingStates.explanations ? (
                          <div className="flex items-center justify-center h-16">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                          </div>
                        ) : (
                          <p>{explanations[selectedOptions[currentPage - 2]]?.strategic || 'Strategic insights will appear here once generated.'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {currentPage === totalPages && (
                <>
                  {/* Recommendations on last page */}
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-3">Recommendations</h2>
                    <div className="text-sm text-gray-700">
                      {loadingStates.recommendations ? (
                        <div className="flex items-center justify-center h-24">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                        </div>
                      ) : (
                        <p>{recommendations}</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Add a cool loading animation component
  const LoadingAnimation = () => {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-6">
              {/* Document assembly animation */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-24 bg-white border-2 border-black rounded-sm relative overflow-hidden">
                  {/* Animated lines representing text */}
                  <div className="h-2 w-16 bg-gray-300 rounded absolute top-4 left-2 animate-pulse"></div>
                  <div className="h-2 w-12 bg-gray-300 rounded absolute top-8 left-2 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-14 bg-gray-300 rounded absolute top-12 left-2 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  <div className="h-2 w-10 bg-gray-300 rounded absolute top-16 left-2 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
                </div>
              </div>
              
              {/* Circular progress indicator */}
              <svg className="animate-spin absolute inset-0" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="#10B981" 
                  strokeWidth="8"
                  strokeDasharray="283"
                  strokeDashoffset="100"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold mb-4">Generating Your Report</h3>
            
            <div className="w-full space-y-3">
              {Object.entries(loadingStates).map(([key, isLoading]) => {
                if (!isLoading) return null;
                
                const label = key === 'reportGeneration' ? 'Compiling report structure' :
                             key === 'salaryData' ? 'Analyzing salary data' :
                             key === 'industryData' ? 'Processing industry sectors' :
                             key === 'locationData' ? 'Mapping geographic distribution' :
                             key === 'graduateSchoolData' ? 'Evaluating graduate school trends' :
                             key === 'industrySalaryData' ? 'Calculating industry salary metrics' :
                             key === 'explanations' ? 'Generating data insights' :
                             key === 'executiveSummary' ? 'Creating executive summary' :
                             key === 'recommendations' ? 'Developing strategic recommendations' : key;
                
                return (
                  <div key={key} className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 mr-3 animate-pulse"></div>
                    <span className="text-gray-700">{label}...</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className={`flex-1 relative transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-72" : "ml-24"}`}>
      <div className="p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl font-bold mb-6">Report Builder</h1>

          <div className="flex gap-6 h-[calc(100vh-12rem)]">
            {/* Left Column - Checkboxes and Year Selection */}
            <div className="w-1/3 bg-white p-6 rounded-lg shadow-md overflow-y-auto border border-black">
              {/* Step 1: Select Data Points */}
              <div className="mb-16">
                <h2 className="text-xl font-semibold mb-4">
                  Step 1: Select Data Points ({selectedOptions.length}/{reportOptions.length})
                </h2>
                
                {/* Dropdown for selecting data points */}
                <div className="relative mb-4" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full px-4 py-2 border border-black rounded-md focus:outline-none text-left flex justify-between items-center"
                  >
                    <span>{selectedOptions.length > 0 ? `${selectedOptions.length} options selected` : "Select data points..."}</span>
                    <svg className={`w-5 h-5 transition-transform ${isDropdownOpen ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>
                  
                  {isDropdownOpen && (
                    <ul className="absolute z-10 w-full bg-white border border-black rounded-md mt-1 max-h-60 overflow-auto">
                      {reportOptions.map((option) => (
                        <li 
                          key={option.id}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent closing dropdown when selecting an option
                            toggleOption(option.id);
                          }}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        >
                          <div className={`w-5 h-5 rounded mr-3 flex items-center justify-center transition-colors ${
                            selectedOptions.includes(option.id) 
                              ? "bg-emerald-500 text-white" 
                              : "bg-white border border-gray-300"
                          }`}>
                            {selectedOptions.includes(option.id) && <Check className="w-3 h-3" />}
                          </div>
                          <span>{option.label}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                {/* Selected options as tags */}
                <div className="mb-4 border border-black rounded-lg p-2">
                  <div className="h-20 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-1">
                      {selectedOptions.map((optionId) => {
                        const option = reportOptions.find(o => o.id === optionId);
                        return (
                          <div
                            key={optionId}
                            className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md flex items-center justify-between text-sm"
                          >
                            <span className="truncate">{option?.label || optionId}</span>
                            <button
                              onClick={() => toggleOption(optionId)}
                              className="ml-1 text-emerald-600 hover:text-emerald-800 flex-shrink-0"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step 2: Select Class Years */}
              <div className="mb-16">
                <h2 className="text-xl font-semibold mb-4">Step 2: Select Class Years</h2>
                <div className="relative mb-4" ref={yearDropdownRef}>
                  <input
                    type="text"
                    value={yearInput}
                    onChange={(e) => handleYearInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (years.includes(yearInput) && !selectedYears.includes(yearInput)) {
                          selectYear(yearInput)
                        }
                      }
                    }}
                    placeholder="Search years..."
                    className="w-full px-4 py-2 border border-black rounded-md focus:outline-none placeholder-black"
                    onFocus={() => {
                      if (yearInput === "") {
                        handleYearInput("");
                      }
                    }}
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black" />
                  {suggestedYears.length > 0 && (
                    <ul className="absolute z-10 w-full bg-white border border-black rounded-md mt-1 max-h-40 overflow-auto">
                      {suggestedYears.map((year, index) => (
                        <li
                          key={index}
                          onClick={() => selectYear(year)}
                          className="px-4 py-2 hover:bg-gray-100 text-black cursor-pointer"
                        >
                          {year}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="mb-4 border border-black rounded-lg p-2">
                  <div className="h-20 overflow-y-auto">
                    <div className="grid grid-cols-5 gap-1">
                      {selectedYears.map((year) => (
                        <div
                          key={year}
                          className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md flex items-center justify-between text-sm"
                        >
                          <span className="truncate">{year}</span>
                          <button
                            onClick={() => removeYear(year)}
                            className="ml-1 text-emerald-600 hover:text-emerald-800 flex-shrink-0"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Step 3: Additional Options */}
              <div className="mb-6 border border-black p-4 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">
                  Step 3: Select Format <span className="text-sm font-normal">(if at least 2 class years are selected)</span>
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Cross Year Comparison</span>
                    <button 
                      onClick={toggleOption1}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        option1Enabled ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          option1Enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Year-by-Year Analysis</span>
                    <button 
                      onClick={toggleOption2}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        option2Enabled ? "bg-emerald-500" : "bg-gray-300"
                      }`}
                    >
                      <span 
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          option2Enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Add more margin-top to create additional space between Step 3 container and buttons */}
              <div className="flex flex-col space-y-4 mt-8">
                <button
                  onClick={handleGenerateReport}
                  className={`w-full ${
                    isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-teal-500/95 hover:scale-105 transform transition-transform duration-300"
                  } text-white py-2 px-4 rounded-md flex items-center justify-center`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </button>
                
                <button
                  onClick={handleClearReport}
                  className="w-full bg-transparent text-black py-2 px-4 rounded-md border border-black hover:bg-black hover:text-white transition-colors duration-300 flex items-center justify-center"
                  disabled={isLoading || !generatedReport}
                >
                  Clear Report
                </button>
              </div>
            </div>

            {/* Right Column - Report Preview */}
            <div className="w-2/3 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Report Preview</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handleDownload}
                    className="bg-transparent text-black py-2 px-6 rounded-md border border-black hover:bg-black hover:text-white transition-colors duration-300 flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </button>
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="bg-transparent text-black py-2 px-6 rounded-md border border-black hover:bg-black hover:text-white transition-colors duration-300 flex items-center"
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Expand Preview
                  </button>
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="bg-transparent text-black p-2 rounded-md border border-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors duration-300 w-10 h-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="bg-transparent text-black p-2 rounded-md border border-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors duration-300 w-10 h-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 backdrop-blur-md bg-slate-700/30 bg-black/5 border border-black rounded-lg overflow-auto shadow-lg">
                <div className="min-h-full p-8 flex justify-center">
                  <ReportContent />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsExpanded(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="backdrop-blur-md bg-white/10 bg-slate-500/20 p-8 max-w-4xl w-full max-h-[90vh] overflow-auto relative rounded-lg border border-black shadow-lg"
            >
              <ReportContent />
              <div className="mt-4 flex justify-center space-x-4">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="bg-transparent text-black py-2 px-4 rounded-md border border-black flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors duration-300"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous Page
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="bg-transparent text-black py-2 px-4 rounded-md border border-black flex items-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black hover:text-white transition-colors duration-300"
                >
                  Next Page
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Modal */}
      <AnimatePresence>
        {showErrorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowErrorModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-red-600">Error</h3>
                <button 
                  onClick={() => setShowErrorModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-gray-700 mb-6">{errorMessage}</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add the loading animation when generating report */}
      {isGeneratingReport && <LoadingAnimation />}
    </main>
  )
}

