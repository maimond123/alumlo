import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { ChartData, getChartById } from '../app/data/chartData';
import { BarChart, LineChart, PieChart } from '../components/chart';
import ChatBot from './ChatBot';

interface ExpandedWidgetProps {
  widgetId: string;
  onClose: () => void;
}

const ExpandedWidget: React.FC<ExpandedWidgetProps> = ({ widgetId, onClose }) => {
  const [chart, setChart] = React.useState<ChartData | null>(null);

  React.useEffect(() => {
    getChartById(widgetId).then((chartData) => {
      if (chartData !== undefined) {
        setChart(chartData);
      } else {
        setChart(null); // or handle the undefined case as needed
      }
    });
  }, [widgetId]);

  if (!chart) {
    return null;
  }

  const renderChart = () => {
    switch (chart.type) {
      case 'bar':
        return <BarChart data={chart.data} />;
      case 'line':
        return <LineChart data={chart.data} />;
      case 'pie':
        return <PieChart data={chart.data} />;
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{chart.title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <p className="text-gray-600 mb-4">{chart.description}</p>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search within this graph..."
            className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              // Implement local search functionality here
              // This could filter the data points or highlight relevant information
            }}
            aria-label="Search within this graph"
          />
        </div>
        <div className="h-[400px] mb-4">
          {renderChart()}
        </div>
        <ChatBot chartId={widgetId} />
      </motion.div>
    </motion.div>
  );
};

export default ExpandedWidget;
