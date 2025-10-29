import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { NotesProvider } from './contexts/NotesContext.jsx'
import { TasksProvider } from './contexts/TasksContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NotesProvider>
      <TasksProvider>
        <App />
      </TasksProvider>
    </NotesProvider>
  </React.StrictMode>,
)
