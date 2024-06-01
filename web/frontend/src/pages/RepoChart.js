// RepoChart.js
import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const RepoChart = ({ repos }) => {
  const chartRef = useRef(null);
  let [chartStatus, setChartStatus] = useState('');

  useEffect(() => {

    const fetchGraph = () => {

      if (repos.length === 0) {
        setChartStatus('No repositories');
        return;
      }

      if (chartRef.current) {
        setChartStatus(`${repos.length} repositorie(s)`);
        const ctx = chartRef.current.getContext('2d');
        const labels = repos.map(repo => repo.name);
        const data = repos.map(repo => parseInt(repo.pull) || 0);
  
        if (chartRef.current.chart) {
          chartRef.current.chart.destroy();
        }
  
        chartRef.current.chart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Number of Pulls per Repository',
              data: data,
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    }

    const intervalId = setInterval(fetchGraph, 2000);

    return () => clearInterval(intervalId);

  }, [repos]);

  <p>{chartStatus}</p>
  return <canvas ref={chartRef}></canvas>;
};

export default RepoChart;
