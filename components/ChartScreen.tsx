// 'use client'

// import { useState } from 'react'
// import { motion } from 'framer-motion'
// import { X } from 'lucide-react'
// import { ChartData } from '../app/data/chartData'
// import { BarChart, LineChart, PieChart } from './chart'
// import ChatBot from './ChatBot'
// import AlumniDistributionChart from './AlumniDistributionChart'
// import EducationLevelsChart from './EducationLevelsChart'

// interface ChartScreenProps {
//   chart: ChartData
//   onClose: () => void
// }

// const ChartScreen: React.FC<ChartScreenProps> = ({ chart, onClose }) => {
//   const renderChart = () => {
//     if (chart.id === 'alumni-distribution-by-industry') {
//       return <AlumniDistributionChart isZoomed={true} />;
//     }
//     if (chart.id === 'alumni-education-levels') {
//       return <EducationLevelsChart isZoomed={true} />;
//     }

//     switch (chart.type) {
//       case 'bar':
//         return <BarChart data={chart.data} isZoomed={true} />;
//       case 'line':
//         return <LineChart data={chart.data} isZoomed={true} />;
//       case 'pie':
//         return <PieChart data={chart.data} isZoomed={true} />;
//       default:
//         return <div>Unsupported chart type</div>;
//     }
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       className="fixed inset-0 z-50 flex items-center justify-center"
//     >
//       <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
//       <motion.div
//         layoutId={`chart-${chart.id}`}
//         className="bg-white rounded-lg shadow-2xl w-[95vw] h-[90vh] max-w-[1800px] z-10 flex overflow-hidden"
//       >
//         <div className="w-2/3 p-6 flex flex-col">
//           <div className="flex justify-between items-center mb-6">
//             <h2 className="text-3xl font-bold text-gray-900">{chart.title}</h2>
//             <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//               <X size={24} />
//             </button>
//           </div>
//           <div className="flex-1 flex items-center justify-center min-h-[700px] -mt-8">
//             <div className="w-full h-full flex items-center justify-center">
//               {renderChart()}
//             </div>
//           </div>
//         </div>
//         <div className="w-1/3 bg-black p-4">
//           <ChatBot chartId={chart.id} chartData={chart} />
//         </div>
//       </motion.div>
//     </motion.div>
//   )
// }

// export default ChartScreen

