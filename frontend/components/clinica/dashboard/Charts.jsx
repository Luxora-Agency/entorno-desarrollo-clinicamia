'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';

export const EChartsWrapper = ({ option, style, loading }) => {
  return (
    <ReactECharts
      option={option}
      style={{ height: '300px', width: '100%', ...style }}
      showLoading={loading}
      theme="light"
    />
  );
};

export const TrendChart = ({ data, title, color = '#3b82f6' }) => {
  const option = {
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(d => d.date)
    },
    yAxis: { type: 'value' },
    series: [
      {
        data: data.map(d => d.count),
        type: 'line',
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: color },
              { offset: 1, color: 'rgba(255, 255, 255, 0)' }
            ]
          }
        },
        itemStyle: { color: color },
        smooth: true
      }
    ]
  };
  return <EChartsWrapper option={option} />;
};

export const CategoryBarChart = ({ data, title }) => {
  const option = {
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: data.map(d => d.name) },
    series: [
      {
        data: data.map(d => d.value),
        type: 'bar',
        itemStyle: {
          color: (params) => {
            const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'];
            return colors[params.dataIndex % colors.length];
          }
        }
      }
    ]
  };
  return <EChartsWrapper option={option} />;
};

export const DonutChart = ({ data, title }) => {
  const option = {
    title: { text: title, left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { top: 'bottom' },
    series: [
      {
        name: title,
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: '20', fontWeight: 'bold' }
        },
        data: data
      }
    ]
  };
  return <EChartsWrapper option={option} />;
};
