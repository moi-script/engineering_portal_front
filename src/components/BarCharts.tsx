// FILE: client/src/components/BarCharts.tsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

// Register necessary Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// Define interface for props
interface BarChartProps {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
}

const BarChart: React.FC<BarChartProps> = (props) => {
    const { mon, tue, wed, thu, fri, sat, sun } = props;
    
    const data = {
        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        datasets: [
            {
                label: 'Weekly Progress',
                data: [mon, tue, wed, thu, fri, sat, sun],
                backgroundColor: '#0e698d',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: {
                ticks: {
                    color: 'white',
                },
            },
            y: {
                beginAtZero: true,
            },
        },
    };

    return (
        // Added text-white to container to match manual style
        <div style={{ width: '100%', height: '300px', color: 'white' }}>
            <Bar data={data} options={options} />
        </div>
    );
};

export default BarChart;