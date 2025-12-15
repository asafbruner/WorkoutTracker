import React from 'react'
import ReactDOM from 'react-dom/client'
import WorkoutTracker from './WorkoutTracker'
import './index.css'
import './storage'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WorkoutTracker />
  </React.StrictMode>,
)
