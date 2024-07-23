import { Outlet } from 'react-router-dom'
import { ActionBar } from './components/ActionBar'
import { CreateQuestDialog } from './components/CreateQuestDialog'
import { QuestList } from './components/QuestList'
import { ScrollableContent } from './components/ScrollableContent'
import { WelcomeModal } from './components/WelcomeModal'
import { EnableNotifDialog } from './components/EnableNotifDialog'
import { searchAtom } from './atoms/searchAtom'
import { useAtom } from 'jotai'

function App() {
  const [search, setSearch] = useAtom(searchAtom)
  return (
    <div className='h-dvh w-full flex flex-col'>
      <div className='w-full h-full overflow-hidden flex flex-col relative'>
        <ScrollableContent className='flex flex-col'>
          <div className='gap-3 px-3 pt-3 lg:gap-10 lg:px-5 lg:pt-10 lg:pb-5 flex-none flex text-xl lg:text-4xl text-stone-400 font-cursive'>
            <button className={''}>Open Quests</button>
            <button className={'opacity-20'}>Ongoing</button>
          </div>
          <div className='show-next-when-empty grid grid-cols-12 gap-3 p-3 lg:gap-5 lg:p-5'>
            <QuestList />
          </div>
          <div className='w-full h-full flex flex-col gap-5 items-center justify-center animate-fadeIn'>
            {!search ? (
              <p className='font-cursive text-2xl opacity-50 text-center px-10 select-none'>
                There's no open Quest to show yet.
              </p>
            ) : (
              <>
                <p className='font-cursive text-2xl opacity-50 text-center px-10 select-none'>
                  No Quests found for "{search}". Try another keyword.
                </p>
                <button onClick={() => setSearch('')}>Reset Filter</button>
              </>
            )}
          </div>
        </ScrollableContent>
        <Outlet />
      </div>
      <ActionBar />
      <CreateQuestDialog />
      <EnableNotifDialog />
      <WelcomeModal />
    </div>
  )
}

export default App
