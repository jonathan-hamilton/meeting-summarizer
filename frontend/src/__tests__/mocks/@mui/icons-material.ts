import React from 'react'

// Create mock components for Material-UI icons
const createMockIcon = (name: string) => {
  return React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => 
    React.createElement('div', { 
      ...props, 
      ref, 
      'data-testid': `${name.toLowerCase()}-icon` 
    }, name)
  )
}

// Export all the icons used in the application
export const ContentCopy = createMockIcon('ContentCopy')
export const CheckCircle = createMockIcon('CheckCircle')
export const Error = createMockIcon('Error')
export const Warning = createMockIcon('Warning')
export const Info = createMockIcon('Info')
export const CloudUpload = createMockIcon('CloudUpload')
export const Settings = createMockIcon('Settings')
export const People = createMockIcon('People')
export const Person = createMockIcon('Person')
export const Edit = createMockIcon('Edit')
export const Mic = createMockIcon('Mic')
export const PersonAdd = createMockIcon('PersonAdd')
export const Close = createMockIcon('Close')
export const CloseIcon = createMockIcon('Close')
export default Close // Default export for 'import Icon from @mui/icons-material/IconName'
export const Save = createMockIcon('Save')
export const Delete = createMockIcon('Delete')
export const AudioFile = createMockIcon('AudioFile')
export const DragIndicator = createMockIcon('DragIndicator')
export const MoreVert = createMockIcon('MoreVert')
export const Add = createMockIcon('Add')

// Default export as an object (in case any components import the entire module)
export default {
  ContentCopy,
  CheckCircle,
  Error,
  Warning,
  Info,
  CloudUpload,
  Settings,
  People,
  Person,
  Edit,
  Mic,
  PersonAdd,
  Close,
  CloseIcon,
  Save,
  Delete,
  AudioFile,
  DragIndicator,
  MoreVert,
  Add,
}
