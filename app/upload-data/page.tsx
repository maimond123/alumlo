"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Check, FileSpreadsheet, AlertCircle } from "lucide-react"
import Sidebar from "../../components/Sidebar"
import { useSidebar } from "../../components/SidebarProvider"
import { supabase } from "../data/supabase"
import { getUserEmail } from "../utils/auth"
import { v4 as uuidv4 } from 'uuid'

export default function UploadDataPage() {
  const { isSidebarOpen } = useSidebar()
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [recentUploads, setRecentUploads] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [schoolName, setSchoolName] = useState<string | null>(null)

  const fetchRecentUploads = async () => {
    try {
      const userEmail = await getUserEmail()
      
      if (!userEmail) return

      const { data, error } = await supabase
        .from('uploaded_data_progress_tracker')
        .select('*')
        .eq('uploaded_by', userEmail)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      if (data) {
        setRecentUploads(data)
      }
    } catch (error) {
      console.error('Error fetching recent uploads:', error)
    }
  }

  useEffect(() => {
    fetchRecentUploads()
  }, [uploadStatus])

  // Update your polling effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (uploadId && uploadStatus === 'uploading') {
      const checkProgress = async () => {
        try {
          // Fixed query - use eq() method instead of directly in URL
          const { data, error } = await supabase
            .from('uploaded_data_progress_tracker')
            .select('progress, status, created_at')
            .eq('id', uploadId)
            .maybeSingle();
            
          if (error && error.code === 'PGRST116') {
            console.log('Record not found yet, will retry');
            return; // Skip this polling cycle
          }
          
          if (data) {
            setUploadProgress(data.progress);
            
            if (data.status === 'completed') {
              setUploadStatus('success');
            } else if (data.status === 'error') {
              setUploadStatus('error');
            }
          }
        } catch (err) {
          console.error('Error polling for progress:', err);
        }
      };
      
      checkProgress();
      intervalId = setInterval(checkProgress, 30000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [uploadId, uploadStatus]);


  useEffect(() => {
    const fetchSchoolName = async () => {
      try {
        const userEmail = await getUserEmail()

        if (!userEmail) {
          console.error('No email found in user data')
          throw new Error('No user email found')
        }

        console.log('Querying with email:', userEmail)
        const { data, error } = await supabase
          .from('customer_information')
          .select('school_name')
          .eq('school_email', userEmail)
          .single()

        if (error) {
          console.error('Supabase query error:', error)
          throw error
        }

        setSchoolName(data.school_name)
      } catch (err) {
        console.error('Error fetching school name:', err)
        setErrorMessage('Failed to load school data')
      }
    }

    fetchSchoolName()
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      validateAndSetFile(droppedFile)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = async (file: File) => {
    const fileType = file.name.split('.').pop()?.toLowerCase()
    
    if (fileType === 'csv' || fileType === 'xlsx' || fileType === 'xls') {
      // Only validate file type, no column checking
      setFile(file)
      setErrorMessage(null)
    } else {
      setFile(null)
      setErrorMessage('Please upload a CSV or Excel file (xlsx/xls)')
    }
  } 

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const removeFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUpload = async () => {
    if (!file) return
    if (!schoolName) {
      setErrorMessage('School information not found')
      setUploadStatus('error')
      return
    }
  
    try {
      setUploadStatus('uploading')
      
      const newUploadId = uuidv4()
      setUploadId(newUploadId)
      setUploadProgress(10) // Initial progress at 10%
      
      const userEmail = await getUserEmail()
      
      if (!userEmail) {
        throw new Error('User not authenticated')
      }
  
      // 1. Get presigned URL
      const response = await fetch('/api/get-upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          uploadId: newUploadId,
          userEmail,
          schoolName
        })
      })
  
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to get upload URL:', errorData)
        throw new Error(`Failed to get upload URL: ${errorData.error || response.statusText}`)
      }
  
      const data = await response.json()
      
      if (!data.signedURL) {
        console.error('No signed URL in response:', data)
        throw new Error('No upload URL provided')
      }
  
      // 2. Upload file using presigned URL
      const uploadResponse = await fetch(data.signedURL, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file
      })
  
      if (!uploadResponse.ok) {
        console.error('Upload failed with status:', uploadResponse.status)
        const errorText = await uploadResponse.text()
        console.error('Error details:', errorText)
        throw new Error(`Failed to upload file: ${uploadResponse.status}`)
      }
  
      // 3. Create entry in uploads table with initial 10% progress
      const { error: uploadError } = await supabase
        .from('uploaded_data_progress_tracker')
        .insert([
          { 
            id: newUploadId,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            status: 'queued',
            progress: 10, // Starting with 10%
            uploaded_by: userEmail,
            school_name: schoolName
          }
        ])
      
      if (uploadError) {
        throw uploadError
      }
      
      // 4. Update upload status to queued
      const { error: updateError } = await supabase
        .from('uploaded_data_progress_tracker')
        .update({ 
          status: 'processing',
          message: 'File is being processed'
        })
        .eq('id', newUploadId)
      
      if (updateError) {
        throw updateError
      }
      
      // No automatic progress update to 70% or 100% here
      // Will poll for updates instead
      setUploadStatus('success')
      
    } catch (error) {
      console.error('Upload error:', error)
      setErrorMessage('An error occurred during upload. Please try again.')
      setUploadStatus('error')
      
      if (uploadId) {
        await supabase
          .from('uploaded_data_progress_tracker')
          .update({ 
            status: 'error',
            message: 'Error during upload'
          })
          .eq('id', uploadId)
      }
    }
  }

  const handleDeleteUpload = async (uploadId: string) => {
    if (confirm('Are you sure you want to delete this upload? This cannot be undone.')) {
      try {
        // Delete from uploaded_data_progress_tracker
        const { error } = await supabase
          .from('uploaded_data_progress_tracker')
          .delete()
          .eq('id', uploadId);
          
        if (error) throw error;
        
        // Also delete the associated file from storage
        const { error: storageError } = await supabase
          .storage
          .from('student_data_uploads')
          .remove([`${uploadId}`]); // Delete the whole folder
        
        if (storageError) console.error('Error deleting file:', storageError);
        
        // Refresh the list
        fetchRecentUploads();
        
      } catch (error) {
        console.error('Error deleting upload:', error);
        alert('Failed to delete upload. Please try again.');
      }
    }
  };
 
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto p-8 pt-16 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-72" : "ml-24"}`}>
        <div className="max-w-6xl mx-auto">
          {/* Centered Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-black">Enrich your Analytics</h1>
            <p className="text-gray-600 text-lg mt-2">Import your student information using CSV or Excel files to enrich your analytics</p>
          </div>
          
          <div className="mb-6 p-6 bg-white rounded-lg shadow-md border border-black">
            <h2 className="text-xl font-bold mb-4">Upload Instructions</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Please upload a CSV or Excel file containing student information with the following columns:</li>
              <li>Student First Name (Column 1)</li>
              <li>Student Last Name (Column 2)</li>
              <li>College/University they are attending (Column 3)</li>
              <li>Graduation Year (Column 4)</li>
            </ol>
            <p>Your file will be processed within a few days, and the data will be added to your analytics and search data base.</p>
          </div>

          {uploadStatus === 'success' ? (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-green-800">Upload Successful!</h3>
                  <div className="mt-2 text-green-700">
                    <p>Your file has been successfully uploaded and is now being processed.</p>
                    <p className="mt-1">You will see the processed data in your system within 24-48 hours.</p>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null)
                      setUploadStatus('idle')
                      setUploadId(null)
                      setUploadProgress(0)
                    }}
                    className="mt-4 px-4 py-2 bg-white text-green-600 rounded border border-green-300 hover:bg-green-50 transition-colors"
                  >
                    Upload Another File
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-8 transition-colors group ${
                isDragOver 
                  ? 'border-emerald-500 bg-emerald-50' 
                  : errorMessage 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-black hover:border-emerald-300 hover:bg-gray-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={handleClick}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
              />
              
              {file ? (
                <div className="flex items-center justify-center flex-col">
                  <FileSpreadsheet className="w-12 h-12 text-emerald-500 mb-2" />
                  <p className="text-lg font-medium text-gray-900 mb-1">{file.name}</p>
                  <p className="text-sm text-gray-500 mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUpload()
                      }}
                      disabled={uploadStatus === 'uploading'}
                      className={`px-4 py-2 rounded flex items-center ${
                        uploadStatus === 'uploading'
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600'
                      }`}
                    >
                      {uploadStatus === 'uploading' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload File
                        </>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile()
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {errorMessage ? (
                    <div className="flex flex-col items-center justify-center text-red-600">
                      <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
                      <p className="text-lg font-medium mb-2">Invalid File Type</p>
                      <p>{errorMessage}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-black mx-auto mb-4 transition-colors duration-300 group-hover:text-emerald-500/50" />
                      <p className="text-lg font-medium text-black mb-1">Drag and drop your file here</p>
                      <p className="text-sm text-gray-500">or click to browse from your computer</p>
                      <p className="text-xs text-gray-500 mt-2">Supported formats: CSV, Excel (xlsx, xls)</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Progress Tracker for Current Upload */}
          {uploadStatus === 'uploading' && uploadId && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{file?.name}</h3>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                {uploadProgress < 50 
                  ? 'Uploading file...' 
                  : uploadProgress < 90 
                    ? 'Validating file contents...' 
                    : 'Finalizing upload...'}
              </p>
            </div>
          )}
          
          {/* History of Uploads */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-black">Recent Uploads</h2>

            {/* Added wrapper div with fixed height and scrolling */}
            <div className="mt-4 max-h-[400px] overflow-y-auto border border-black rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      File Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Upload Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-black">
       
                  {recentUploads.length > 0 ? (
                    recentUploads.map((upload) => (
                      <tr key={upload.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {upload.file_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(upload.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${upload.status === 'queued' ? 'bg-blue-100 text-blue-800' : 
                              upload.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                              upload.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {upload.progress !== undefined && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                                style={{ width: `${upload.progress}%` }}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No recent uploads
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 