import { Outlet } from 'react-router-dom'
import { ActionBar } from './components/ActionBar'
import { CreateQuestDialog } from './components/CreateQuestDialog'
import { QuestList } from './components/QuestList'
import { QuestPage } from './components/QuestPage'
import { ScrollableContent } from './components/ScrollableContent'
import { WelcomeModal } from './components/WelcomeModal'
import { Suspense } from 'react'

function App() {
  return (
    <div className='h-screen w-full flex flex-col'>
      <div className='w-full h-full overflow-hidden flex flex-col relative'>
        <ScrollableContent className='flex flex-col'>
          <div className='show-next-when-empty grid grid-cols-12 gap-3 p-3 lg:gap-5 lg:p-5'>
            <QuestList />
          </div>
          <div className='w-full h-full flex items-center justify-center animate-fadeIn'>
            <p className='font-cursive text-2xl opacity-50 text-center px-10 select-none'>
              There's no open Quest to show yet.
            </p>
          </div>
        </ScrollableContent>
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </div>
      <ActionBar />
      <CreateQuestDialog />
      <WelcomeModal />
    </div>
  )
}

export default App
