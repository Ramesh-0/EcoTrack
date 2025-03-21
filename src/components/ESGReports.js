// components/ESGReports.js
import React from 'react';
import { FileTextOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';

function ESGReports() {
  return (
    <div className="esg-reports-list">
      <div className="report-item">
        <div className="report-icon">
          <FileTextOutlined />
        </div>
        <div className="report-details">
          <h4>Annual Sustainability Report 2025</h4>
          <p>Complete ESG disclosure for stakeholders and regulators</p>
        </div>
        <div className="report-actions">
          <button className="download-btn">
            <DownloadOutlined /> Download
          </button>
        </div>
      </div>
      
      <div className="report-item">
        <div className="report-icon">
          <FileTextOutlined />
        </div>
        <div className="report-details">
          <h4>Carbon Disclosure Project Report</h4>
          <p>Q1 2025 submission for CDP reporting</p>
        </div>
        <div className="report-actions">
          <button className="download-btn">
            <DownloadOutlined /> Download
          </button>
        </div>
      </div>
      
      <div className="report-item">
        <div className="report-icon">
          <FileTextOutlined />
        </div>
        <div className="report-details">
          <h4>GRI Compliance Dashboard</h4>
          <p>Real-time monitoring of GRI standards compliance</p>
        </div>
        <div className="report-actions">
          <button className="generate-btn">
            <ReloadOutlined /> Generate New Report
          </button>
        </div>
      </div>
    </div>
  );
}

export default ESGReports;