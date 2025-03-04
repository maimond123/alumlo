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

  useEffect(() => {
    // Fetch recent uploads when component mounts
    const fetchRecentUploads = async () => {
      try {
        const userEmail = await getUserEmail()
        
        if (!userEmail) return

        const { data, error } = await supabase
          .from('data_uploads')
          .select('*')
          .eq('uploaded_by', userEmail)
          .order('created_at', { ascending: false })
          .limit(5)
        
        if (error) throw error
        
        if (data) {
          setRecentUploads(data)
        }
      } catch (error) {
        console.error('Error fetching recent uploads:', error)
      }
    }

    fetchRecentUploads()
  }, [uploadStatus]) // Refetch when upload status changes

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

  const validateAndSetFile = (file: File) => {
    const fileType = file.name.split('.').pop()?.toLowerCase()
    
    if (fileType === 'csv' || fileType === 'xlsx' || fileType === 'xls') {
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

    try {
      setUploadStatus('uploading')
      
      // Generate a unique ID for this upload
      const newUploadId = uuidv4()
      setUploadId(newUploadId)
      setUploadProgress(10) // Start with 10%
      
      // Get user email
      const userEmail = await getUserEmail()
      
      if (!userEmail) {
        throw new Error('User not authenticated')
      }
      
      // Create entry in uploads table
      const { data: uploadData, error: uploadError } = await supabase
        .from('data_uploads')
        .insert([
          { 
            id: newUploadId,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            status: 'processing',
            progress: 10,
            uploaded_by: userEmail
          }
        ])
        .select()
      
      if (uploadError) {
        throw uploadError
      }
      
      setUploadProgress(30) // Update progress
      
      // Simulate file upload to storage
      // In a real implementation, you would upload the file to Supabase Storage
      await new Promise(resolve => setTimeout(resolve, 1500))
      setUploadProgress(70)
      
      // Update upload status
      const { error: updateError } = await supabase
        .from('data_uploads')
        .update({ progress: 70, status: 'validating' })
        .eq('id', newUploadId)
      
      if (updateError) {
        throw updateError
      }
      
      // Simulate validation and processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      setUploadProgress(100)
      
      // Final update to mark as queued for processing
      const { error: finalUpdateError } = await supabase
        .from('data_uploads')
        .update({ 
          progress: 100, 
          status: 'queued',
          message: 'File has been received and queued for processing'
        })
        .eq('id', newUploadId)
      
      if (finalUpdateError) {
        throw finalUpdateError
      }
      
      setUploadStatus('success')
    } catch (error) {
      console.error('Upload error:', error)
      setErrorMessage('An error occurred during upload. Please try again.')
      setUploadStatus('error')
      
      // Update error in database if we have an upload ID
      if (uploadId) {
        await supabase
          .from('data_uploads')
          .update({ 
            status: 'error',
            message: 'Error during upload'
          })
          .eq('id', uploadId)
      }
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <main className={`flex-1 overflow-y-auto p-8 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-72" : "ml-24"}`}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Student Data</h1>
            <p className="text-gray-600 text-lg">Import your student information using CSV or Excel files</p>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-50 to-white p-6 rounded-xl shadow-sm border border-emerald-100 mb-8">
            <h2 className="text-xl font-semibold text-emerald-900 mb-4 flex items-center">
              <FileSpreadsheet className="w-5 h-5 mr-2 text-emerald-600" />
              Upload Instructions
            </h2>
            <p className="text-gray-700 mb-4">
              Please upload a CSV or Excel file containing student information with the following columns:
            </p>
            <ul className="space-y-2 mb-6 text-gray-700">
              {['Student First Name', 'Student Last Name', 'College/University they are attending'].map((item) => (
                <li key={item} className="flex items-center">
                  <Check className="w-4 h-4 text-emerald-500 mr-2" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <p className="text-emerald-700 text-sm">
                Your file will be processed within 24-48 hours, and the data will be added to your system.
              </p>
            </div>
          </div>

          {uploadStatus === 'success' ? (
            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-200 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-emerald-100 p-2 rounded-full">
                  <Check className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-emerald-900">Upload Successful!</h3>
                  <div className="mt-2 text-emerald-700">
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
                    className="mt-4 px-6 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors duration-200"
                  >
                    Upload Another File
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              className={`border-3 border-dashed rounded-xl p-10 text-center mb-8 transition-all duration-200 ${
                isDragOver 
                  ? 'border-emerald-500 bg-emerald-50 shadow-lg scale-[1.02]' 
                  : errorMessage 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-emerald-300 hover:bg-gray-50'
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
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-1">Drag and drop your file here</p>
                      <p className="text-sm text-gray-500">or click to browse from your computer</p>
                      <p className="text-xs text-gray-400 mt-2">Supported formats: CSV, Excel (xlsx, xls)</p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Progress Tracker - Updated styling */}
          {uploadStatus === 'uploading' && uploadId && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500 mr-2" />
                  <h3 className="font-medium text-gray-900">{file?.name}</h3>
                </div>
                <span className="text-sm font-medium text-emerald-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="mt-2 text-sm text-gray-600 flex items-center">
                <span className="animate-pulse mr-2">●</span>
                {uploadProgress < 50 
                  ? 'Uploading file...' 
                  : uploadProgress < 90 
                    ? 'Validating file contents...' 
                    : 'Finalizing upload...'}
              </p>
            </div>
          )}
          
          {/* Recent Uploads - Updated styling */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Recent Uploads</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['File Name', 'Upload Date', 'Status', 'Progress'].map((header) => (
                      <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                upload.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${upload.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs mt-1">{upload.progress}%</span>
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