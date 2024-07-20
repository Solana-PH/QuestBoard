import { useAtomValue } from 'jotai'
import { FC } from 'react'
import { questsAtom } from '../atoms/questsAtom'
import { QuestCard } from './QuestCard'

export const QuestList: FC = () => {
  const list = useAtomValue(questsAtom)

  return (
    <>
      {list.map((quest) => {
        const id = quest.publicKey.toBase58()
        return <QuestCard key={id} {...quest} />
      })}
    </>
  )
}
