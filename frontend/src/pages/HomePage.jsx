import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

export default function HomePage() {
  return (
    <div className="home-main">
      <div className="title">
        <div className='eDNA-logo'></div>
        <h1>Workbench</h1>
      </div>

      <div className="entry">
        <Link to="/analysis" className="analysis-entry entry-box">
          <div className="card-image-wrapper">
            <div className="card-image"></div>
          </div>
          <div className="card-content">
            <span className="entry-tag">Analysis</span>
            <p className="entry-title">eDNA Barcode Toolkit</p>
            <div className="entry-description">
              <ul>
                <li>Run automated analysis pipelines and monitor progress in real time.</li>
                <li>Review results, logs, and status for ongoing or completed runs.</li>
                <li>Export analysis outputs and manage processing jobs from a single interface.</li>
              </ul>
            </div>
            <div className="entry-cta">Launch <span>→</span></div>
          </div>
        </Link>

        <Link to="/phylotree" className="visualization-entry entry-box">
          <div className="card-image-wrapper">
            <div className="card-image"></div>
          </div>
          <div className="card-content">
            <span className="entry-tag">Visualization</span>
            <p className="entry-title">Visualization Suite</p>
            <div className="entry-description">
              <ul>
                <li>Explore interactive phylogenetic trees with node details and export options.</li>
                <li>Inspect sequence alignments and interactively filter or export visual data.</li>
                <li>Visualize haplotype networks alongside geographic maps and linked tables.</li>
              </ul>
            </div>
            <div className="entry-cta">Explore <span>→</span></div>
          </div>
        </Link>
      </div>

      <section className="connect-us">
        <h2>Contact Us</h2>
        <div className="contact-list">
          <div className="contact-person">
            <p className="person-name">Wen-Yu Chung</p>
            <a href="mailto:wychung@nkust.edu.tw" className="contact-email">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              wychung@nkust.edu.tw
            </a>
          </div>
          <div className="contact-person">
            <p className="person-name">Bo-Lun Wang</p>
            <a href="mailto:a0903083574@gmail.com" className="contact-email">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              a0903083574@gmail.com
            </a>
          </div>
          <div className="contact-person">
            <p className="person-name">Yu-Han Lu</p>
            <a href="mailto:angus.lu0611@gmail.com" className="contact-email">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 7l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              angus.lu0611@gmail.com
            </a>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <p>© 2026 BICL.CSIE@NKUST, Taiwan. All rights reserved.</p>
      </footer>
    </div>
  );
}