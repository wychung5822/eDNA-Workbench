// src/components/DockerCheckPanel.jsx
import { useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import '../styles/components/DockerCheckPanel.css'

const DockerCheckPanel = ({ onDockerReady }) => {
    const [checking, setChecking] = useState(true)
    const [dockerStatus, setDockerStatus] = useState(null)
    const [showInstructions, setShowInstructions] = useState(false)

    // Pull progress state
    const [pulling, setPulling] = useState(false)
    const [pullLogs, setPullLogs] = useState([])
    const [pullError, setPullError] = useState(null)
    const pullEsRef = useRef(null)
    const logsEndRef = useRef(null)

    // Auto-scroll pull log to bottom
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [pullLogs])

    // Cleanup SSE on unmount
    useEffect(() => {
        return () => { pullEsRef.current?.close() }
    }, [])

    const doCheck = async () => {
        setChecking(true)
        try {
            const response = await api.docker.checkEnvironment()
            setDockerStatus(response.data)
            return response.data
        } catch (error) {
            const status = {
                success: false,
                checks: {
                    dockerInstalled: false,
                    dockerRunning: false,
                    imageAvailable: false
                },
                message: error.response?.data?.message || 'Failed to check Docker environment'
            }
            setDockerStatus(status)
            return status
        } finally {
            setChecking(false)
        }
    }

    const startPullRef = useRef(null)

    const startPull = () => {
        setPulling(true)
        setPullLogs([])
        setPullError(null)

        pullEsRef.current = api.docker.pullImage({
            onProgress: (msg) => {
                setPullLogs((prev) => [...prev, msg])
            },
            onDone: async () => {
                setPulling(false)
                // Re-check after pull completes
                await doCheck()
            },
            onError: (msg) => {
                setPulling(false)
                setPullError(msg)
            }
        })
    }
    startPullRef.current = startPull

    useEffect(() => {
        const initialCheck = async () => {
            const status = await doCheck()
            // If Docker is running but image is missing, auto-start pull
            if (
                status.checks?.dockerInstalled &&
                status.checks?.dockerRunning &&
                !status.checks?.imageAvailable
            ) {
                startPullRef.current()
            }
        }
        initialCheck()
    }, [])

    const handleRecheck = async () => {
        if (dockerStatus?.checks?.dockerInstalled === false) {
            try {
                await window.electronAPI.reinitializeBackend()
            } catch (error) {
                console.error('Backend reinitialization failed:', error)
            }
        }

        const status = await doCheck()
        if (status.success) {
            setShowInstructions(false)
        }

        // If image still missing after manual recheck, restart pull
        if (
            status.checks?.dockerInstalled &&
            status.checks?.dockerRunning &&
            !status.checks?.imageAvailable &&
            !pulling
        ) {
            startPull()
        }
    }

    const getStatusText = (status) => {
        if (status === true) return 'Ready'
        if (status === false) return 'Not Ready'
        return 'Checking...'
    }

    const handleNext = () => {
        if (dockerStatus?.success) {
            onDockerReady()
        }
    }

    const renderPullProgress = () => (
        <div className="instructions-content">
            <h3>
                {pulling ? 'Downloading Docker Image...' : pullError ? 'Download Failed' : 'Download Complete'}
            </h3>
            <p className="note">
                Note: First-time setup requires downloading approximately 1–2 GB of data.
                Please ensure a stable internet connection.
            </p>

            <div className="pull-log-box">
                {pullLogs.map((line, i) => (
                    <div key={i} className="pull-log-line">{line}</div>
                ))}
                {pulling && <div className="pull-log-line pull-log-cursor">▌</div>}
                <div ref={logsEndRef} />
            </div>

            {pullError && (
                <p className="pull-error">
                    ✗ {pullError}
                </p>
            )}

            {!pulling && pullError && (
                <div className="button-container" style={{ marginTop: '1rem' }}>
                    <button className="instruction-toggle" onClick={startPull}>
                        Retry Download
                    </button>
                </div>
            )}
        </div>
    )

    const renderInstructions = () => {
        const { checks } = dockerStatus

        if (!checks.dockerInstalled) {
            return (
                <div className="instructions-content">
                    <h3>Docker Not Installed</h3>
                    <p>This application requires Docker Desktop to run its analysis environment.</p>
                    <p>Please visit the official Docker website to download the version suitable for your system.</p>

                    <div className="download-links">
                        <a
                        href="https://www.docker.com/products/docker-desktop/"
                        className="download-button primary"
                        target="_blank"
                        rel="noopener noreferrer"
                        >
                        Download from Docker.com
                        </a>
                    </div>

                    <div className="instruction-steps">
                        <h4>Installation Steps:</h4>
                        <ol>
                            <li>Click the button above to go to the official Docker website.</li>
                            <li>On their page, find and download the correct installer for your system.</li>
                            <li>Run the installer and follow the on-screen instructions.</li>
                            <li>After installation is complete, launch Docker Desktop from your applications.</li>
                            <li>Wait for Docker to fully start (the whale icon in your system tray or menu bar will stop animating and stay lit).</li>
                            <li>Once Docker is running, come back to this application and click the "Recheck" button below.</li>
                        </ol>
                    </div>
                </div>
            )
        }

        if (!checks.dockerRunning) {
            return (
                <div className="instructions-content">
                    <h3>Docker Not Running</h3>
                    <p>Docker is installed but not running. Please start Docker:</p>

                    <div className="instruction-steps">
                        <h4>Windows / macOS:</h4>
                        <ol>
                            <li>Open the Docker Desktop application</li>
                            <li>Wait for Docker to start (usually takes 10-30 seconds)</li>
                            <li>Confirm the Docker icon in the system tray shows green</li>
                            <li>Click the "Recheck" button below</li>
                        </ol>

                        <h4>Linux:</h4>
                        <ol>
                            <li>Open a terminal</li>
                            <li>Run: <code>sudo systemctl start docker</code></li>
                            <li>Check Docker status: <code>sudo systemctl status docker</code></li>
                            <li>Click the "Recheck" button below</li>
                        </ol>
                    </div>
                </div>
            )
        }

        if (!checks.imageAvailable) {
            return renderPullProgress()
        }

        return null
    }

    return (
        <div className="docker-check-panel">
            <div className="panel-header">
                <div className="docker-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" class="ionicon" viewBox="0 0 512 512"><path d="M507 211.16c-1.42-1.19-14.25-10.94-41.79-10.94a132.55 132.55 0 00-21.61 1.9c-5.22-36.4-35.38-54-36.57-55l-7.36-4.28-4.75 6.9a101.65 101.65 0 00-13.06 30.45c-5 20.7-1.9 40.2 8.55 56.85-12.59 7.14-33 8.8-37.28 9H15.94A15.93 15.93 0 000 262.07a241.25 241.25 0 0014.75 86.83C26.39 379.35 43.72 402 66 415.74 91.22 431.2 132.3 440 178.6 440a344.23 344.23 0 0062.45-5.71 257.44 257.44 0 0081.69-29.73 223.55 223.55 0 0055.57-45.67c26.83-30.21 42.74-64 54.38-94h4.75c29.21 0 47.26-11.66 57.23-21.65a63.31 63.31 0 0015.2-22.36l2.14-6.18z" /><path d="M47.29 236.37H92.4a4 4 0 004-4v-40.48a4 4 0 00-4-4H47.29a4 4 0 00-4 4v40.44a4.16 4.16 0 004 4M109.5 236.37h45.12a4 4 0 004-4v-40.48a4 4 0 00-4-4H109.5a4 4 0 00-4 4v40.44a4.16 4.16 0 004 4M172.9 236.37H218a4 4 0 004-4v-40.48a4 4 0 00-4-4h-45.1a4 4 0 00-4 4v40.44a3.87 3.87 0 004 4M235.36 236.37h45.12a4 4 0 004-4v-40.48a4 4 0 00-4-4h-45.12a4 4 0 00-4 4v40.44a4 4 0 004 4M109.5 178.57h45.12a4.16 4.16 0 004-4v-40.48a4 4 0 00-4-4H109.5a4 4 0 00-4 4v40.44a4.34 4.34 0 004 4M172.9 178.57H218a4.16 4.16 0 004-4v-40.48a4 4 0 00-4-4h-45.1a4 4 0 00-4 4v40.44a4 4 0 004 4M235.36 178.57h45.12a4.16 4.16 0 004-4v-40.48a4.16 4.16 0 00-4-4h-45.12a4 4 0 00-4 4v40.44a4.16 4.16 0 004 4M235.36 120.53h45.12a4 4 0 004-4V76a4.16 4.16 0 00-4-4h-45.12a4 4 0 00-4 4v40.44a4.17 4.17 0 004 4M298.28 236.37h45.12a4 4 0 004-4v-40.48a4 4 0 00-4-4h-45.12a4 4 0 00-4 4v40.44a4.16 4.16 0 004 4" /></svg>
                </div>
                <h2>Docker Environment Check</h2>
                <p>This tool requires Docker to run the analysis</p>
            </div>

            <div className="check-status">
                {checking ? (
                    <div className="checking-spinner">
                        <div className="spinner"></div>
                        <p>Checking Docker environment...</p>
                    </div>
                ) : (
                    <>
                        <div className="status-list">
                            <div className={`status-item ${dockerStatus?.checks.dockerInstalled ? 'success' : 'error'}`}>
                                <span className="status-label">Docker Installation</span>
                                <span className="status-value">{getStatusText(dockerStatus?.checks.dockerInstalled)}</span>
                            </div>

                            <div className={`status-item ${dockerStatus?.checks.dockerRunning ? 'success' : 'error'}`}>
                                <span className="status-label">Docker Service</span>
                                <span className="status-value">{getStatusText(dockerStatus?.checks.dockerRunning)}</span>
                            </div>

                            <div className={`status-item ${dockerStatus?.checks.imageAvailable ? 'success' : pulling ? 'warning' : 'warning'}`}>
                                <span className="status-label">Analysis Image</span>
                                <span className="status-value">
                                    {pulling ? 'Downloading...' : getStatusText(dockerStatus?.checks.imageAvailable)}
                                </span>
                            </div>
                        </div>

                        {/* Show pull progress inline when pulling */}
                        {pulling || (pullLogs.length > 0) || pullError ? (
                            <div className="instructions-panel">
                                {renderPullProgress()}
                            </div>
                        ) : !dockerStatus?.success ? (
                            <>
                                <div className="button-container">
                                    <button
                                        className="instruction-toggle"
                                        onClick={() => setShowInstructions(!showInstructions)}
                                    >
                                        {showInstructions ? 'Hide Instructions' : 'Show Installation Guide'}
                                    </button>
                                </div>
                                {showInstructions && (
                                    <div className="instructions-panel">
                                        {renderInstructions()}
                                    </div>
                                )}
                            </>
                        ) : null}
                    </>
                )}
            </div>

            <div className="panel-actions">
                <button
                    className="recheck-button"
                    onClick={handleRecheck}
                    disabled={checking || pulling}
                >
                    {checking ? 'Checking...' : 'Recheck'}
                </button>

                <button
                    className="next-button"
                    onClick={handleNext}
                    disabled={!dockerStatus?.success || checking || pulling}
                >
                    Next
                </button>
            </div>
        </div>
    )
}

export default DockerCheckPanel
