import { ActionBar } from './components/ActionBar'
import { CreateQuestDialog } from './components/CreateQuestDialog'
import { QuestList } from './components/QuestList'
import { ScrollableContent } from './components/ScrollableContent'

function App() {
  return (
    <div className='h-screen w-full flex flex-col'>
      <ScrollableContent className='flex flex-col'>
        <div className='show-next-when-empty grid grid-cols-12 gap-3 p-3 lg:gap-5 lg:p-5'>
          <QuestList />
        </div>
        <div className='w-full h-full flex items-center justify-center'>
          <p className='font-cursive text-2xl opacity-50 text-center px-10 select-none'>
            There's no open Quest to show yet.
          </p>
        </div>
      </ScrollableContent>
      <ActionBar />
      <CreateQuestDialog />
    </div>
  )
}

export default App
