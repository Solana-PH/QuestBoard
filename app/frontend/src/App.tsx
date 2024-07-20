import { ActionBar } from './components/ActionBar'
import { CreateQuestDialog } from './components/CreateQuestDialog'

function App() {
  return (
    <div className='h-screen w-full flex flex-col'>
      <div className='flex flex-auto'></div>
      <ActionBar />
      <CreateQuestDialog />
    </div>
  )
}

export default App
